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
  renderedHtml?: string;
  senderName?: string;
}

export interface SendEmailResult {
  html: string;
  error?: string;
  messageId?: string;
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
 * Returns the rendered HTML and a soft error string instead of throwing.
 */
function formatFromAddress(fromEnv: string, senderName?: string): string {
  if (!senderName) return fromEnv;
  const match = fromEnv.match(/<(.+)>/);
  const emailAddress = match?.[1] ?? fromEnv;
  return `${senderName} <${emailAddress}>`;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, templateName, context, renderedHtml, senderName } = options;
  const defaultFrom = process.env.RESEND_FROM ?? 'Claver HR <onboarding@resend.dev>';
  const from = formatFromAddress(defaultFrom, senderName);
  let html = renderedHtml ?? '';

  try {
    if (!renderedHtml) {
      html = previewEmail(templateName, { ...context, subject });
    }

    const { data, error } = await getResend().emails.send({ from, to, subject, html });
    if (error) {
      console.error('[email.service] Resend error:', error);
      return { html, error: error.message ?? 'Unknown send error' };
    }

    console.log(`[email.service] Email sent → ${Array.isArray(to) ? to.join(', ') : to}`);
    return { html, messageId: data?.id };
  } catch (err) {
    console.error('[email.service] Failed to send email:', err);
    const message = err instanceof Error ? err.message : 'Unknown send error';
    return { html, error: message };
  }
}
