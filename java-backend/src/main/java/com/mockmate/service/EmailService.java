package com.mockmate.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name}")
    private String appName;

    @Async
    public void sendInterviewLink(String toEmail, String name, String link,
                                   int roundNumber, List<String> technologies) {
        try {
            String techList = String.join(", ", technologies);
            String subject = appName + " - Your Round " + roundNumber + " Interview is Ready!";
            String body = buildInterviewLinkEmail(name, link, roundNumber, techList);
            sendHtmlEmail(toEmail, subject, body);
            log.info("Interview link sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send interview link email", e);
        }
    }

    @Async
    public void sendInterviewResult(String toEmail, String name, double score,
                                     boolean passed, int roundNumber, List<String> technologies) {
        try {
            String techList = String.join(", ", technologies);
            String subject = appName + " - Round " + roundNumber + " Results: " + (passed ? "Passed! 🎉" : "Try Again");
            String body = buildResultEmail(name, score, passed, roundNumber, techList);
            sendHtmlEmail(toEmail, subject, body);
            log.info("Result email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send result email", e);
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }

    private String buildInterviewLinkEmail(String name, String link, int round, String techs) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f4f4; padding: 20px;">
              <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #6366f1; margin: 0;">🎯 MockMate</h1>
                  <p style="color: #888; margin: 5px 0;">AI-Powered Mock Interviews</p>
                </div>
                <h2 style="color: #1f2937;">Hi %s! 👋</h2>
                <p style="color: #4b5563; line-height: 1.6;">
                  Your <strong>Round %d</strong> mock interview is ready to begin!
                </p>
                <div style="background: #f0f9ff; border-left: 4px solid #6366f1; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; color: #1f2937;"><strong>Technologies:</strong> %s</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="%s" style="background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                    Start Interview →
                  </a>
                </div>
                <p style="color: #9ca3af; font-size: 13px; text-align: center;">
                  This link is unique to you. Take a deep breath and do your best!
                </p>
              </div>
            </body>
            </html>
            """.formatted(name, round, techs, link);
    }

    private String buildResultEmail(String name, double score, boolean passed, int round, String techs) {
        String emoji = passed ? "🎉" : "💪";
        String statusColor = passed ? "#10b981" : "#ef4444";
        String statusText = passed ? "Congratulations! You Passed!" : "Keep Practicing!";
        String nextSteps = passed
                ? "You've qualified for Round " + (round + 1) + "! Check your dashboard for the next interview."
                : "Review your feedback and practice more. You can retake the interview from your dashboard.";

        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f4f4; padding: 20px;">
              <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #6366f1; margin: 0;">🎯 MockMate</h1>
                </div>
                <h2 style="color: #1f2937;">Hi %s! %s</h2>
                <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px; margin: 20px 0;">
                  <h1 style="color: %s; margin: 0; font-size: 48px;">%.1f<span style="font-size: 24px;">/10</span></h1>
                  <p style="color: %s; font-weight: bold; font-size: 18px;">%s</p>
                </div>
                <p style="color: #4b5563; line-height: 1.6;">%s</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                    View Full Report →
                  </a>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, emoji, statusColor, score, statusColor, statusText, nextSteps);
    }
}
