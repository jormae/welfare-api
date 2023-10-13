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
    "SELECT nationalId, memberName, debtId, bank, allowance, studentLoan, houseRent, "+
    "totalLoanDuration1, totalPaymentMonth1, monthlyPayment1, ((totalLoanDuration1 - totalPaymentMonth1) * monthlyPayment1) AS debt1, "+
    "totalLoanDuration2, totalPaymentMonth2, monthlyPayment2, ((totalLoanDuration2 - totalPaymentMonth2) * monthlyPayment2) AS debt2 "+
    "FROM "+
    "( "+
      "SELECT m.nationalId, memberName, debtId, "+
        "(SELECT bank FROM tbl_debt d WHERE d.nationalId = m.nationalId AND yearMonth = ?) AS bank, (SELECT allowance FROM tbl_debt d WHERE d.nationalId = m.nationalId AND yearMonth = ?) AS allowance,  "+
        "(SELECT studentLoan FROM tbl_debt d WHERE d.nationalId = m.nationalId AND yearMonth = ?) AS studentLoan,  "+
        "(SELECT houseRent FROM tbl_debt d WHERE d.nationalId = m.nationalId AND yearMonth = ?) AS houseRent,  "+
        "(SELECT TIMESTAMPDIFF(MONTH, CONCAT(SUBSTR(startLoanDate,1,7),'-01'), ?) + 1 FROM tbl_loan ll LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = ll.loanTypeId WHERE ll.nationalId = m.nationalId AND closeLoanStatusId = 0 AND loanMainTypeId = 1 ) AS totalLoanDuration1, "+
        "(SELECT COUNT(*) FROM tbl_loan_payment lp LEFT JOIN tbl_loan ll ON ll.loanId = lp.loanId LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = ll.loanTypeId WHERE ll.nationalId = m.nationalId AND closeLoanStatusId = 0 AND loanMainTypeId = 1 AND EXTRACT(YEAR_MONTH FROM loanPaymentMonth) <= EXTRACT(YEAR_MONTH FROM ?)) AS totalPaymentMonth1, "+
        "(SELECT monthlyPayment FROM tbl_loan ll LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = ll.loanTypeId WHERE ll.nationalId = m.nationalId AND closeLoanStatusId = 0 AND loanMainTypeId = 1) AS monthlyPayment1, "+
        "(SELECT TIMESTAMPDIFF(MONTH, CONCAT(SUBSTR(startLoanDate,1,7),'-01'), ?) + 1 FROM tbl_loan ll LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = ll.loanTypeId WHERE ll.nationalId = m.nationalId AND closeLoanStatusId = 0 AND loanMainTypeId = 2 ) AS totalLoanDuration2, "+
        "(SELECT COUNT(*) FROM tbl_loan_payment lp LEFT JOIN tbl_loan ll ON ll.loanId = lp.loanId LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = ll.loanTypeId WHERE ll.nationalId = m.nationalId AND closeLoanStatusId = 0 AND lt.loanMainTypeId = 2 AND EXTRACT(YEAR_MONTH FROM loanPaymentMonth) <= EXTRACT(YEAR_MONTH FROM ?)) AS totalPaymentMonth2,  "+
        "(SELECT monthlyPayment FROM tbl_loan ll LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = ll.loanTypeId WHERE ll.nationalId = m.nationalId AND closeLoanStatusId = 0 AND loanMainTypeId = 2) AS monthlyPayment2 "+
        "FROM tbl_member m "+
        "LEFT JOIN tbl_debt d ON d.nationalId = m.nationalId "+
            "WHERE (m.nationalId IN ( SELECT DISTINCT nationalId FROM tbl_loan WHERE closeLoanStatusId = 0) OR m.nationalId IN (SELECT DISTINCT nationalId FROM tbl_debt )) "+
        ") AS x "+
        "HAVING (debt1 <> 0 OR debt2 <> 0 OR bank IS NOT NULL OR allowance IS NOT NULL OR studentLoan IS NOT NULL OR houseRent IS NOT NULL) "+
        "ORDER BY memberName";
        // console.log(mysql)
    connection.query(mysql, [yearMonth, yearMonth, yearMonth, yearMonth, yearMonthDate, yearMonthDate, yearMonthDate, yearMonthDate], (err, results, fields) => {
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
      "SELECT SUM(bank) AS TOTAL_BANK_DEBT, "+
      "SUM(allowance) AS TOTAL_ALLOWANCE_DEBT, "+
      "SUM(studentLoan) AS TOTAL_STUDENTLOAN_DEBT,  "+
      "SUM(houseRent) AS TOTAL_HOUSERENT_DEBT  "+
      "FROM tbl_debt d "+
      "WHERE yearMonth = ?";
    connection.query(mysql, yearMonth, (err, results, fields) => {
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
