const nodemailer = require("nodemailer");
const aws = require("@aws-sdk/client-ses");

const ses = new aws.SES({
  apiVersion: "2010-12-01",
  region: "ap-southeast-1",
});

var transporter = nodemailer.createTransport({
  SES: { ses, aws },
});

const send_email = async (mainRecipient, subject, message, cc, bcc) => {
  if (mainRecipient === null || mainRecipient === "") {
    console.error("Recipient is empty");
    throw new Error("Recipient is empty");
  }
  if (subject === null || subject === "") {
    console.error("Subject is empty");
    throw new Error("Subject is empty");
  }
  if (message === null || message === "") {
    console.error("Message is empty");
    throw new Error("Message is empty");
  }
  let mailOptions = {
    from: process.env.AWS_SES_SENDER_EMAIL,
    to: mainRecipient,
    subject: subject,
  };
  if (cc)
    mailOptions.cc = cc;
  if (bcc)
    mailOptions.bcc = bcc;
  if (process.env.AWS_DUMMY_RECEIVER_EMAIL) {
    mailOptions.text = "\n TO:" + mainRecipient + "\n CC:" + cc + "\n BCC:" + bcc + "\n" + message;
    mailOptions.to = process.env.AWS_DUMMY_RECEIVER_EMAIL;
  } else {
    mailOptions.text = message;
  }
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = {
  send_email
};