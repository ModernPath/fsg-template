/**
 * Inngest Functions - Materials Generation Notifications
 * 
 * Send email notifications for materials generation status updates
 */

import { inngest } from "../inngest-client";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getServiceClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Email sending function (using SendGrid)
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  
  if (!sendgridApiKey) {
    console.warn("SENDGRID_API_KEY not configured, skipping email");
    return { success: false, reason: "no_api_key" };
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sendgridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject,
          },
        ],
        from: {
          email: process.env.EMAIL_FROM || "noreply@trustyfinance.fi",
          name: process.env.EMAIL_FROM_NAME || "TrustyFinance",
        },
        content: [
          {
            type: "text/html",
            value: html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send email via SendGrid:", error);
      return { success: false, reason: "api_error", details: error };
    }

    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, reason: "exception" };
  }
}

/**
 * Notify when documents are required
 */
export const notifyDocumentsRequired = inngest.createFunction(
  {
    id: "materials-notify-documents-required",
    name: "Materials: Notify Documents Required",
  },
  { event: "materials/require-uploads" },
  async ({ event, step }) => {
    const { jobId, companyId, organizationId } = event.data;
    const supabase = getServiceClient();

    const result = await step.run("send-email-notification", async () => {
      // Get job details
      const { data: job } = await supabase
        .from("material_generation_jobs")
        .select(`
          id,
          created_by,
          companies(name)
        `)
        .eq("id", jobId)
        .single();

      if (!job) return { success: false, reason: "job_not_found" };

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(
        job.created_by
      );

      if (!userData.user?.email) {
        return { success: false, reason: "no_email" };
      }

      // Send email
      return await sendEmail({
        to: userData.user.email,
        subject: `Action Required: Upload Financial Documents - ${job.companies?.name}`,
        html: `
          <h2>Document Upload Required</h2>
          <p>Your materials generation job for <strong>${job.companies?.name}</strong> is ready for the next step.</p>
          
          <p>Please upload the following financial documents:</p>
          <ul>
            <li>Profit & Loss Statement (last 3 years)</li>
            <li>Balance Sheet (latest)</li>
            <li>Cash Flow Statement (optional but recommended)</li>
          </ul>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/materials/job/${jobId}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Upload Documents
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            This is an automated notification from your materials generation system.
          </p>
        `,
      });
    });

    return result;
  }
);

/**
 * Notify when questionnaire is ready
 */
export const notifyQuestionnaireReady = inngest.createFunction(
  {
    id: "materials-notify-questionnaire-ready",
    name: "Materials: Notify Questionnaire Ready",
  },
  { event: "materials/generate-questionnaire" },
  async ({ event, step }) => {
    const { jobId, companyId } = event.data;
    const supabase = getServiceClient();

    // Wait a bit to ensure questionnaire is generated
    await step.sleep("wait-for-generation", "10s");

    const result = await step.run("send-email-notification", async () => {
      // Get job details
      const { data: job } = await supabase
        .from("material_generation_jobs")
        .select(`
          id,
          created_by,
          companies(name)
        `)
        .eq("id", jobId)
        .single();

      if (!job) return { success: false, reason: "job_not_found" };

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(
        job.created_by
      );

      if (!userData.user?.email) {
        return { success: false, reason: "no_email" };
      }

      // Get question count
      const { count: questionCount } = await supabase
        .from("material_questionnaire_responses")
        .select("*", { count: "exact", head: true })
        .eq("job_id", jobId);

      // Send email
      return await sendEmail({
        to: userData.user.email,
        subject: `Action Required: Complete Questionnaire - ${job.companies?.name}`,
        html: `
          <h2>Questionnaire Ready</h2>
          <p>Your materials generation job for <strong>${job.companies?.name}</strong> has generated a custom questionnaire.</p>
          
          <p>We've prepared ${questionCount || 0} questions to help us better understand your business and create comprehensive materials.</p>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/materials/job/${jobId}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Questionnaire
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            This should take approximately 10-15 minutes to complete.
          </p>
        `,
      });
    });

    return result;
  }
);

/**
 * Notify when materials are generated
 */
export const notifyGenerationComplete = inngest.createFunction(
  {
    id: "materials-notify-generation-complete",
    name: "Materials: Notify Generation Complete",
  },
  { event: "materials/generation-complete" },
  async ({ event, step }) => {
    const { jobId } = event.data;
    const supabase = getServiceClient();

    const result = await step.run("send-email-notification", async () => {
      // Get job details with assets
      const { data: job } = await supabase
        .from("material_generation_jobs")
        .select(`
          id,
          created_by,
          generate_teaser,
          generate_im,
          generate_pitch_deck,
          teaser_asset_id,
          im_asset_id,
          pitch_deck_asset_id,
          companies(name)
        `)
        .eq("id", jobId)
        .single();

      if (!job) return { success: false, reason: "job_not_found" };

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(
        job.created_by
      );

      if (!userData.user?.email) {
        return { success: false, reason: "no_email" };
      }

      // Build list of generated materials
      const materials: string[] = [];
      if (job.generate_teaser && job.teaser_asset_id) {
        materials.push("Teaser");
      }
      if (job.generate_im && job.im_asset_id) {
        materials.push("Information Memorandum");
      }
      if (job.generate_pitch_deck && job.pitch_deck_asset_id) {
        materials.push("Pitch Deck");
      }

      // Send email
      return await sendEmail({
        to: userData.user.email,
        subject: `Materials Ready: ${job.companies?.name}`,
        html: `
          <h2>🎉 Your Materials Are Ready!</h2>
          <p>Great news! We've successfully generated professional business materials for <strong>${job.companies?.name}</strong>.</p>
          
          <h3>Generated Materials:</h3>
          <ul>
            ${materials.map(m => `<li>${m}</li>`).join("")}
          </ul>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/materials/job/${jobId}" 
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View & Download Materials
            </a>
          </p>
          
          <p style="margin-top: 24px;">
            You can now review, download, and share these materials with potential buyers and investors.
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            If you need any revisions or have questions, please don't hesitate to reach out.
          </p>
        `,
      });
    });

    return result;
  }
);

/**
 * Notify when generation fails
 */
export const notifyGenerationFailed = inngest.createFunction(
  {
    id: "materials-notify-generation-failed",
    name: "Materials: Notify Generation Failed",
  },
  { event: "materials/generation-failed" },
  async ({ event, step }) => {
    const { jobId, error } = event.data;
    const supabase = getServiceClient();

    const result = await step.run("send-email-notification", async () => {
      // Get job details
      const { data: job } = await supabase
        .from("material_generation_jobs")
        .select(`
          id,
          created_by,
          companies(name)
        `)
        .eq("id", jobId)
        .single();

      if (!job) return { success: false, reason: "job_not_found" };

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(
        job.created_by
      );

      if (!userData.user?.email) {
        return { success: false, reason: "no_email" };
      }

      // Send email
      return await sendEmail({
        to: userData.user.email,
        subject: `Generation Failed: ${job.companies?.name}`,
        html: `
          <h2>Generation Issue</h2>
          <p>We encountered an issue while generating materials for <strong>${job.companies?.name}</strong>.</p>
          
          <p style="background-color: #fee; border-left: 4px solid #f00; padding: 12px; margin: 16px 0;">
            <strong>Error:</strong> ${error || "Unknown error occurred"}
          </p>
          
          <p>Our team has been notified and will look into this issue. You can try again or contact support for assistance.</p>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/materials/new" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Try Again
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            We apologize for the inconvenience.
          </p>
        `,
      });
    });

    return result;
  }
);

