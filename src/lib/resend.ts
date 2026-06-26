import { ErrorResponse, Resend } from "resend";
import { env } from "../config/environment";

const resend = new Resend(env.resend.apiKey);

const fromEmail: string = env.resend.fromEmail || "onboarding@resend.dev";
const fromName: string = env.resend.fromName || "AUTH";

export async function sendUserEmail({
  userEmail,
  subject,
  htmlContent,
}: IEmailFormat): Promise<IEmailResponse> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [userEmail],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("An error occurred while sending the email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: err as ErrorResponse};
  }
}