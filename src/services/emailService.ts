// src/services/emailService.ts
import nodemailer from 'nodemailer';
import config from '../config/index.js';
import { IUser } from '../models/User.model.js'; // Assuming IUser has firstName, lastName, email, role

/**
 * Email Service
 * Configures and provides functions for sending application emails.
 */

// Create a reusable transporter object using SMTP transport
// It uses staging or production settings based on NODE_ENV
const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  // secure: config.isProduction, // Use true for 465, false for other ports (like 587 with STARTTLS) - Nodemailer detects automatically based on port
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
});

// Verify transporter connection (optional, good for diagnosing issues)
transporter.verify((error) => {
  if (error) {
    console.error('Error configuring email transporter:', error);
  } else {
    console.log('Email transporter configured successfully. Ready to send emails.');
  }
});

/**
 * Sends a welcome email to a newly registered user.
 * @param user - The user who signed up.
 */
export const sendWelcomeEmail = async (user: Pick<IUser, 'firstName' | 'lastName' | 'email' | 'role'>): Promise<void> => {
  const subject = 'Welcome to Saintshub!';
  // Basic text content (HTML can be added later)
  let textContent = `Hi ${user.firstName},\n\nWelcome aboard Saintshub! We're thrilled to have you.`;
  if (user.role === 'pastor' || user.role === 'IT') {
    textContent += `\n\nSince you identified yourself as a ${user.role}, your account is pending review before full access is granted. We will contact you shortly.`;
  }
  textContent += `\n\nBest regards,\nThe Saintshub Team`;

  // Basic HTML content (can use templating engines like Handlebars, EJS later)
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eeeeee; }
        .header img { max-width: 150px; }
        .content { padding: 20px 0; color: #333333; line-height: 1.6; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #777777; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        strong { color: #0056b3; }
        .review-notice { padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffeeba; margin-top: 15px; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${config.brand.logoUrl || 'YOUR_DEFAULT_LOGO_URL'}" alt="Saintshub Logo">
        </div>
        <div class="content">
          <p>Hi ${user.firstName},</p>
          <p>Welcome aboard <strong>Saintshub</strong>! We're thrilled to have you.</p>
  `;
  if (user.role === 'pastor' || user.role === 'IT') {
    htmlContent += `<div class="review-notice">Since you identified yourself as a <strong>${user.role}</strong>, your account is pending review before full access is granted. We will contact you shortly.</div>`;
  }
  htmlContent += `
          <p>You can access your dashboard here:</p>
          <p style="text-align: center;"><a href="${config.brand.dashboardUrl || '#'}" class="button">Go to Dashboard</a></p>
          <p>Best regards,<br>The Saintshub Team</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Saintshub. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: config.mail.fromNoReply, // Use configured no-reply address
    to: user.email,
    subject: subject,
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${user.email}: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending welcome email to ${user.email}:`, error);
    // Depending on requirements, might want to re-throw or handle differently
  }
};

/**
 * Sends a notification email to the admin about a new user signup.
 * @param user - The user who signed up.
 */
export const sendAdminNotificationEmail = async (user: Pick<IUser, 'firstName' | 'lastName' | 'email' | 'role'>): Promise<void> => {
  const subject = 'New User Registration';
  const textContent = `A new user has registered:\n\nName: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nRole: ${user.role}\n\nPlease check the admin dashboard.`;
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .content { padding: 20px 0; color: #333333; line-height: 1.6; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #777777; }
        .button { display: inline-block; padding: 10px 20px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        strong { color: #17a2b8; }
        ul { list-style: none; padding: 0; }
        li { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <h2>New User Registration Notification</h2>
          <p>A new user has registered:</p>
          <ul>
            <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Role:</strong> ${user.role}</li>
          </ul>
          <p>Please review their details and approve if necessary in the admin dashboard:</p>
          <p style="text-align: center;"><a href="${config.brand.dashboardUrl || '#'}/admin" class="button">Go to Admin Dashboard</a></p>
        </div>
        <div class="footer">
          This is an automated notification from Saintshub.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: config.mail.fromAdmin, // Use configured admin address
    to: config.mail.adminNotificationEmail, // Send to configured admin notification address
    subject: subject,
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Admin notification email sent successfully: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending admin notification email:', error);
  }
};

/**
 * Sends an account approval email to the user.
 * @param user - The user object containing firstName, lastName, and email.
 */
export const sendApprovalEmail = async (user: Pick<IUser, 'firstName' | 'lastName' | 'email'>): Promise<void> => {
  const subject = 'Your Saintshub Account Has Been Approved!';

  // Simple HTML content for the approval email
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .header { text-align: center; margin-bottom: 20px; }
        .content p { margin-bottom: 15px; }
        .footer { margin-top: 20px; text-align: center; font-size: 0.9em; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Account Approved!</h2>
        </div>
        <div class="content">
          <p>Hi ${user.firstName} ${user.lastName},</p>
          <p>Good news! Your account request for the Pastor/IT role on Saintshub has been reviewed and approved by an administrator.</p>
          <p>You now have access to the relevant features associated with your role.</p>
          <p>Thank you for joining our community!</p>
          <p>Best regards,<br>The Saintshub Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Saintshub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Define email options
  const mailOptions = {
    from: `"Saintshub Admin" <${config.mail.fromAdmin}>`, // Sender address
    to: user.email, // List of receivers
    subject: subject, // Subject line
    html: htmlContent, // HTML body content
  };

  // Send email
  await transporter.sendMail(mailOptions);
  console.log(`Approval email sent to ${user.email}`);
};

// Add placeholders for other email functions if needed (e.g., verification)
// export const sendVerificationEmail = async (user: IUser, token: string): Promise<void> => { ... };
