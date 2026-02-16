const {
  Verification_Email_Template,
  Welcome_Email_Template,
} = require("../emailTemplate");
const transporter = require("./config");

const sendVerificationCode = async (email, verificationCode) => {
  try {
    const response = await transporter.sendMail({
      from: '"HostPro" <adeelimran467@gmail.com>',
      to: email,
      subject: "Verify your Email - HostPro",
      text: `Your verification code is: ${verificationCode}`,
      html: Verification_Email_Template.replace(
        "{verificationCode}",
        verificationCode
      ),
    });
    console.log("Verification Email Sent Successfully", response.messageId);
  } catch (err) {
    console.error("Error sending verification email:", err);
    throw err;
  }
};

const welcomeCode = async (email, name) => {
  try {
    const response = await transporter.sendMail({
      from: '"HostPro" <adeelimran467@gmail.com>',
      to: email,
      subject: "Welcome to HostPro",
      text: `Welcome, ${name}!`,
      html: Welcome_Email_Template.replace("{name}", name),
    });
    console.log("Welcome Email Sent Successfully", response.messageId);
  } catch (err) {
    console.error("Error sending welcome email:", err);
  }
};

module.exports = { sendVerificationCode, welcomeCode };
