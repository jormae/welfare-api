const express = require("express");
const connection = require("../config/database-connection");
const router = express.Router();
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator");
const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Bangkok");

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

router.get("/date/:yearMonth", (req, res) => {
    const yearMonth = req.params.yearMonth
    const yearMonthDate = req.params.yearMonth + "-01"
  try {
    const mysql =
      "SELECT m.nationalId, memberName, "+
      "(SELECT bank FROM tbl_debt d WHERE d.nationalId = m.nationalId AND yearMonth = ?) AS bank, (SELECT allowance FROM tbl_debt d WHERE d.nationalId = m.nationalId AND yearMonth = ?) AS allowance,  "+
      "(SELECT studentLoan FROM tbl_debt d WHERE d.nationalId = m.nationalId AND yearMonth = ?) AS studentLoan,  "+
      "(SELECT houseRent FROM tbl_debt d WHERE d.nationalId = m.nationalId AND yearMonth = ?) AS houseRent,  "+
      "(SELECT TIMESTAMPDIFF(MONTH, startLoanDate, ?) + 1 FROM tbl_loan ll LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = ll.loanTypeId WHERE ll.nationalId = m.nationalId AND closeLoanStatusId = 0 AND loanMainTypeId = 1 ) AS totalLoanDuration1, "+
      "(SELECT COUNT(*) FROM tbl_loan_payment lp  LEFT JOIN tbl_loan ll ON ll.loanId = lp.loanId LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = ll.loanTypeId WHERE ll.nationalId = m.nationalId AND closeLoanStatusId = 0 AND loanMainTypeId = 1) AS totalPaymentMonth1, "+
      "(SELECT TIMESTAMPDIFF(MONTH, startLoanDate, ?) + 1 FROM tbl_loan ll LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = ll.loanTypeId WHERE ll.nationalId = m.nationalId AND closeLoanStatusId = 0 AND loanMainTypeId = 2 ) AS totalLoanDuration2, "+
      "(SELECT COUNT(*) FROM tbl_loan_payment lp LEFT JOIN tbl_loan ll ON ll.loanId = lp.loanId LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = ll.loanTypeId WHERE ll.nationalId = m.nationalId AND closeLoanStatusId = 0 AND lt.loanMainTypeId = 2) AS totalPaymentMonth2  "+
        "FROM tbl_member m "+
        "WHERE (m.nationalId IN ( SELECT DISTINCT nationalId FROM tbl_loan ) OR m.nationalId IN (SELECT DISTINCT nationalId FROM tbl_debt )) "+
        "ORDER BY memberName";
    connection.query(mysql, [yearMonth, yearMonth, yearMonth, yearMonth, yearMonthDate, yearMonthDate], (err, results, fields) => {
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

router.get("/sum/:yearMonth", (req, res) => {
    const yearMonth = req.params.yearMonth
  try {
    const mysql =
      "SELECT SUM(debtAmount) AS TOTAL_ALLOWANCE_BALANCE, "+ 
      "(SELECT SUM(debtAmount) FROM tbl_debt al WHERE debtTypeId = 1) AS INCOME_ALLOWANCE,  "+
      "(SELECT SUM(debtAmount) FROM tbl_debt al WHERE debtTypeId = 2) AS EXPENSE_ALLOWANCE  "+
      "FROM tbl_debt a ";
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

// post
router.post("/", async (req, res) => {
    
    const { yearMonth, nationalId, bank, allowance, studentLoan, houseRent, username } = req.body;
    const createdAt =  moment().format('YYYY-MM-DD H:m:s');
    console.log(req.body)
    try {
      connection.query(
        "INSERT INTO tbl_debt(yearMonth, nationalId, bank, allowance, studentLoan, houseRent, createdBy, createdAt) VALUES (?,?,?,?,?,?,?,?)",
        [yearMonth, nationalId, bank, allowance, studentLoan, houseRent, username , createdAt],
        (err, results, fields) => {
          if (err) {
            console.log("Error :: บันทึกข้อมูลเงินสวัสดิการล้มเหลว!", err);
            return res.status(400).send();
          }
          return res
            .status(201)
            .json({ status: 'success', message: "บันทึกข้อมูลเงินสวัสดิการเรียบร้อยแล้ว!" });
        }
      );
    } catch (err) {
      console.log(err);
      return res.status(500).send();
    }
  }
);

router.delete("/:debtId", async (req, res) => {
  const debtId = req.params.debtId;
  try {
    connection.query(
      "DELETE FROM tbl_debt WHERE debtId = ?",
      [debtId],
      (err, results, fields) => {
        if (err) {
          console.log("Error while deleting a debt in database!", err);
          return res.status(400).send();
        }
        return res
          .status(200)
          .json({ status:"success", message: "ลบข้อมูลรายการลูกหนี้เรียบร้อยแล้ว!" });
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});

module.exports = router;
