var nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
var fs = require("fs");
const path = require("path");
var aws = require("@aws-sdk/client-ses");
var { defaultProvider } = require("@aws-sdk/credential-provider-node");

const ses = new aws.SES({
  apiVersion: "2010-12-01",
  region: "ap-southeast-1",
  defaultProvider,
});

var transporter = nodemailer.createTransport({
  SES: { ses, aws },
});

const handlebarOptions = {
  viewEngine: {
    partialsDir: path.resolve("./service/email/template/"),
    defaultLayout: false,
  },
  viewPath: path.resolve("./service/email/template/"),
};

transporter.use("compile", hbs(handlebarOptions));

function email_broadcast(receiptent, subject, file) {
  var mailOptions = {
    from: "workarrangemnent_noreply@SerenShift.com",
    bcc: receiptent,
    subject: subject,
    html: file,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

module.exports = {
  email_broadcast: email_broadcast,
};