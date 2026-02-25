import { describe, it, expect, vi, beforeEach } from 'vitest';
import { previewEmail, sendEmail } from '../src/services/email.service';

// Mock Resend so no real API calls are made
const mockSend = vi.fn().mockResolvedValue({ data: { id: 'mock-email-id' }, error: null });

vi.mock('resend', () => {
  return {
    Resend: function MockResend() {
      return { emails: { send: mockSend } };
    },
  };
});

describe('previewEmail', () => {
  it('renders the application-received template with context', () => {
    const html = previewEmail('application-received', {
      candidateName: 'Alice Smith',
      roleName: 'Senior Engineer',
      companyName: 'Acme Corp',
      submittedAt: '2026-02-25',
    });

    expect(html).toContain('Alice Smith');
    expect(html).toContain('Senior Engineer');
    expect(html).toContain('Acme Corp');
    expect(html).toContain('We received your application');
  });

  it('renders the custom-message template with context', () => {
    const html = previewEmail('custom-message', {
      candidateName: 'Bob Jones',
      companyName: 'Acme Corp',
      senderName: 'HR Team',
      body: 'We would like to invite you for an interview.',
    });

    expect(html).toContain('Bob Jones');
    expect(html).toContain('We would like to invite you for an interview.');
    expect(html).toContain('HR Team');
    expect(html).toContain('Acme Corp');
  });

  it('throws a clear error for a missing template', () => {
    expect(() => previewEmail('nonexistent-template', {})).toThrow(
      'Email template "nonexistent-template" not found'
    );
  });

  it('renders the layout partial (contains wrapper HTML)', () => {
    const html = previewEmail('application-received', {
      candidateName: 'Test',
      roleName: 'Role',
      companyName: 'Company',
      submittedAt: '2026-01-01',
    });
    // Layout should inject full HTML shell
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('max-width: 600px');
  });
});

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_FROM = 'Claver HR <onboarding@resend.dev>';
  });

  it('sends to the correct address without throwing', async () => {
    const result = await sendEmail({
      to: 'candidate@example.com',
      subject: 'Your Application',
      templateName: 'application-received',
      context: {
        candidateName: 'Jane Doe',
        roleName: 'Product Designer',
        companyName: 'Startup Inc',
        submittedAt: '2026-02-25',
      },
    });

    expect(result.error).toBeUndefined();
    expect(result.html).toContain('Jane Doe');
  });

  it('does not throw when Resend returns an error', async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: 'Invalid API key' } });

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      templateName: 'custom-message',
      context: {
        candidateName: 'Test',
        companyName: 'Test Co',
        senderName: 'Admin',
        body: 'Hello',
      },
    });

    expect(result.error).toBe('Invalid API key');
  });

  it('does not throw when template is missing', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      templateName: 'totally-missing-template',
      context: {},
    });

    expect(result.error).toBeDefined();
    expect(result.html).toBe('');
  });

  it('uses the provided sender name while keeping the configured address', async () => {
    await sendEmail({
      to: 'candidate@example.com',
      subject: 'Hello',
      templateName: 'application-received',
      senderName: 'Acme Corp',
      context: {
        candidateName: 'Jane Doe',
        roleName: 'Product Designer',
        companyName: 'Acme Corp',
        submittedAt: '2026-02-25',
      },
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Acme Corp <onboarding@resend.dev>',
      })
    );
  });
});
