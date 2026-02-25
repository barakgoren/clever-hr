import { Resend } from 'resend';
import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATES_DIR = path.join(__dirname, '..', 'email-templates');
const PARTIALS_DIR = path.join(TEMPLATES_DIR, 'partials');

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Register all .hbs files in the partials/ directory as Handlebars partials.
 * Each file is registered under its basename without extension.
 */
function registerPartials(): void {
  if (!fs.existsSync(PARTIALS_DIR)) return;
  const files = fs.readdirSync(PARTIALS_DIR).filter((f) => f.endsWith('.hbs'));
  for (const file of files) {
    const name = path.basename(file, '.hbs');
    const source = fs.readFileSync(path.join(PARTIALS_DIR, file), 'utf-8');
    Handlebars.registerPartial(name, source);
  }
}

// Register partials once at module load
registerPartials();

/**
 * Load and compile a Handlebars template by name.
 * Throws a clear error if the template file does not exist.
 */
function compileTemplate(templateName: string): HandlebarsTemplateDelegate {
  const filePath = path.join(TEMPLATES_DIR, `${templateName}.hbs`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Email template "${templateName}" not found at ${filePath}`);
  }
  const source = fs.readFileSync(filePath, 'utf-8');
  return Handlebars.compile(source);
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  templateName: string;
  context: Record<string, unknown>;
}

/**
 * Render a Handlebars template with the given context and return the HTML string.
 * Useful for previewing templates in tests or the UI.
 */
export function previewEmail(templateName: string, context: Record<string, unknown>): string {
  const template = compileTemplate(templateName);
  return template(context);
}

/**
 * Send an HTML email via Resend using a Handlebars template.
 * Logs errors without throwing — fire-and-forget safe.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, templateName, context } = options;
  try {
    const html = previewEmail(templateName, { ...context, subject });
    const from = process.env.RESEND_FROM ?? 'Claver HR <onboarding@resend.dev>';
    const { error } = await getResend().emails.send({ from, to, subject, html });
    if (error) {
      console.error('[email.service] Resend error:', error);
    } else {
      console.log(`[email.service] Email sent → ${Array.isArray(to) ? to.join(', ') : to}`);
    }
  } catch (err) {
    console.error('[email.service] Failed to send email:', err);
  }
}
