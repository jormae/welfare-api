const express = require("express");
const connection = require("../config/database-connection");
const router = express.Router();
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator");
const moment = require("moment-timezone");
const multer  =   require('multer');
const path = require('path')

const uploadInfo = require("../middlewares/upload-file");
moment.tz.setDefault("Asia/Bangkok");

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

router.get("/", (req, res) => {
  try {
    const mysql =
      "SELECT *, (SELECT SUM(totalShare) FROM tbl_investment i WHERE i.nationalId = m.nationalId) AS totalInvestment " +
      "FROM tbl_member m " +
      "LEFT JOIN tbl_member_role mr ON mr.memberRoleId = m.memberRoleId " +
      "LEFT JOIN tbl_member_type mt ON mt.memberTypeId = m.memberTypeId " +
      "LEFT JOIN tbl_payment_type pt ON pt.paymentTypeId = m.paymentTypeId " +
      "LEFT JOIN tbl_position p ON p.positionId = m.positionId " +
      "LEFT JOIN tbl_spouse s ON s.memberNationalId = m.nationalId";
    connection.query(mysql, (err, results, fields) => {
      if (err) {
        console.log(err);
        return res.status(400).send();
      }
      res.status(200).json(results);
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});

// router.get("/members/:nationalId", async (req, res) => {
//   const nationalId = req.params.nationalId;
//   try {
//     connection.query(
//       "SELECT *, " +
//         "(SELECT SUM(paymentAmount) FROM tbl_loan_payment lp WHERE nationalId = ? AND lp.loanId = l.loanId) AS totalPayment " +
//         "FROM tbl_loan l " +
//         "LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = l.loanTypeId " +
//         "LEFT JOIN tbl_loan_status ls ON ls.loanStatusId = l.loanStatusId " +
//         "WHERE nationalId = ?",
//       [nationalId, nationalId],
//       (err, results, fields) => {
//         if (err) {
//           console.log(err);
//           return res.status(400).send();
//         }
//         res.status(200).json(results);
//       }
//     );
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send();
//   }
// });

// post loan-monthly-payment
router.post("/", uploadInfo,
body("loanId","loanPaymentMonth").custom((value, { req }) => {
  return new Promise((resolve, reject) => {
    const loanId = req.body.loanId;
    const loanPaymentMonth = req.body.loanPaymentMonth;
    connection.query(
      "SELECT * FROM tbl_loan_payment WHERE loanId = ? AND loanPaymentMonth = ?",
      [loanId, loanPaymentMonth],
      (err, res) => {
        if (err) {
          reject(new Error("Server Error"));
        }
        if (res.length > 0) {
          reject(new Error("บันทึกการชำระเงินสวัสดิการซ้ำ!"));
        }
        resolve(true);
      }
    );
  });
}),
async (req, res) => {
    const { nationalId, loanId, loanPaymentMonth, monthNo, paymentAmount, paymentTypeId, userName, memberRoleId, slip, totalLoanBalance, isCloseLoanPayment } = req.body;
    const datetime =  moment().format('YYYY-MM-DD H:m:s');
    const approvedAt = (memberRoleId != 4) ? datetime : null
    const approvedBy = (memberRoleId != 4) ? userName : null
    // const isCloseLoanPayment = (totalLoanBalance == paymentAmount) ? 1 : null
    // const slip = req.body.slip;
    // console.log('slip = '+slip)
    const paymentFilePath =  req.paymentFilePath;
    console.log('paymentFilePath  = '+paymentFilePath)
    // console.log(paymentFilePath)


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    try {
      connection.query(
        "INSERT INTO tbl_loan_payment(loanId, loanPaymentMonth, monthNo, paymentAmount, paymentTypeId, createdAt, createdBy, approvedAt, approvedBy, paymentFilePath, isCloseLoanPayment) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [loanId, loanPaymentMonth, monthNo, paymentAmount, paymentTypeId, datetime, userName, approvedAt, approvedBy, paymentFilePath, isCloseLoanPayment],
        (err, results, fields) => {
          if (err) {
            console.log("Error :: บันทึกข้อมูลการชำระเงินสวัสดิการล้มเหลว!", err);
            return res.status(400).send();
          }
          if(isCloseLoanPayment == 1){
            connection.query("UPDATE tbl_loan SET closeLoanStatusId = 3 WHERE loanId = ?", loanId);
          }
          return res
            .status(201)
            .json({ status: 'success', message: "บันทึกข้อมูลการชำระเงินสวัสดิการเรียบร้อยแล้ว!" });
        }
      );
    } catch (err) {
      console.log(err);
      return res.status(500).send();
    }
  }
);

router.put("/:nationalId", async (req, res) => {
  const nationalId = req.params.nationalId;
  const deptId = req.body.deptId;
  const deptName = req.body.deptName;
  const deptStatusId = req.body.deptStatusId;
  const branchId = req.body.branchId;
  const orgId = req.body.orgId;
  try {
    connection.query(
      "UPDATE tbl_member SET deptName = ?, deptStatusId = ?, branchId = ?, orgId = ? WHERE nationalId = ?",
      [deptName, deptStatusId, branchId, orgId, nationalId],
      (err, results, fields) => {
        if (err) {
          console.log("Error while updating a dept in database!", err);
          return res.status(400).send();
        }
        return res
          .status(200)
          .json({ message: "The dept is successfully updated!" });
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});

module.exports = router;
