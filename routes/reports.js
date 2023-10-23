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

router.get("/", (req, res) => {
  try {
    const mysql =
      "SELECT * "+
      "FROM tbl_allowance a "+
      "LEFT JOIN tbl_allowance_type at ON at.allowanceTypeId = a.allowanceTypeId "+
      "ORDER BY allowanceDateTime DESC";
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

router.get("/monthly/welfare/count-payment/:date", (req, res) => {
  const date = req.params.date + '%'
  console.log(date)
  try {
    const mysql =
      "SELECT COUNT(*) AS TOTAL_MEMBER  "+  //total pending pay members
      "FROM tbl_loan "+ 
      "WHERE loanStatusId = 1   "+ 
      "AND loanId NOT IN   "+ 
      "( SELECT loanId FROM tbl_loan_payment WHERE loanPaymentMonth LIKE ?) "+
      "UNION  "+ 
      "SELECT COUNT(*) AS TOTAL_MEMBER "+ //total paid members
      "FROM tbl_loan_payment "+ 
      "WHERE loanPaymentMonth LIKE ? ";
    connection.query(mysql, [date, date], (err, results, fields) => {
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

router.get("/monthly/welfare/paid/:date", (req, res) => {
  const date = req.params.date + '%'
  console.log(date)
  try {
    const mysql =
      "SELECT *, lp.approvedBy AS paymentApprovedBy "+
      "FROM tbl_loan_payment lp "+
      "LEFT JOIN tbl_payment_type pt ON pt.paymentTypeId = lp.paymentTypeId "+
      "LEFT JOIN tbl_loan l ON l.loanId = lp.loanId "+
      "LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = l.loanTypeId "+
      "LEFT JOIN tbl_member m ON m.nationalId = l.nationalId "+
      "WHERE loanPaymentMonth LIKE ?";
    connection.query(mysql, [date], (err, results, fields) => {
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

router.get("/monthly/welfare/pending-payment/:date", (req, res) => {
    const date = req.params.date + '%'
    console.log(date)
    try {
      const mysql =
     " SELECT approvedAt, memberName, positionName, memberTypeName, loanTypeName, loanAmount, loanStatusName, loanDurationInMonth, monthlyPayment, (loanAmount - (if(loanBalance IS NOT NULL, loanBalance, 0))) AS loanBalance, loanId, nationalId, startLoanDate, endLoanDate, (if(monthNo IS NOT NULL, monthNo, 0)+1) AS monthNo "+
     "FROM  "+
     "(SELECT l.approvedAt, memberName, positionName, memberTypeName, loanTypeName, loanAmount, loanStatusName, loanDurationInMonth, monthlyPayment, l.loanId, l.nationalId, startLoanDate, endLoanDate, (SELECT SUM(paymentAmount) FROM tbl_loan_payment lp WHERE lp.loanId = l.loanId) AS loanBalance, (SELECT MAX(monthNo) FROM tbl_loan_payment lp1 WHERE lp1.loanId = l.loanId) AS monthNo "+      
     "FROM tbl_loan l   "+
     "LEFT JOIN tbl_member m ON m.nationalId = l.nationalId   "+
     "LEFT JOIN tbl_loan_type lt ON lt.loanTypeId = l.loanTypeId   "+
     "LEFT JOIN tbl_loan_status ls ON ls.loanStatusId = l.loanStatusId   "+
     "LEFT JOIN tbl_member_type mt ON mt.memberTypeId = m.memberTypeId  "+ 
     "LEFT JOIN tbl_position p ON p.positionId = m.positionId  "+ 
     "LEFT JOIN tbl_loan_payment lp ON lp.loanId = l.loanId  "+ 
     "WHERE l.loanStatusId = 1  "+ 
     "AND l.loanId NOT IN  "+ 
     "( SELECT loanId FROM tbl_loan_payment WHERE loanPaymentMonth LIKE ?)  "+
     "GROUP BY l.loanId  "+
     ") AS x  "+
     "ORDER BY loanTypeName, loanAmount, memberName";
      connection.query(mysql, [date], (err, results, fields) => {
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

router.get("/monthly/welfare/followup-payment/:date", (req, res) => {
    const date = req.params.date + '%'
    console.log(date)
    try {
      const mysql =
        "SELECT * "+
        "FROM tbl_loan_payment lp "+
        "WHERE createdAt LIKE ?";
      connection.query(mysql, [date], (err, results, fields) => {
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

router.get("/monthly/welfare/sum-payment/:date", (req, res) => {
    const date = req.params.date + '-28'
    const yearMonth = req.params.date + '%'
    console.log(date)
    try {
      const mysql =
        "SELECT SUM(amount) AS TOTAL_BALANCE "+
        "FROM tbl_loan   "+
        "WHERE ? BETWEEN `startLoanDate` AND `endLoanDate` "+
        "UNION "+
        "SELECT SUM(paymentAmount) AS TOTAL_BALANCE "+ //paid balance
        "FROM tbl_loan_payment lp "+
        "WHERE lp.loanPaymentMonth LIKE ?";
      connection.query(mysql, [date, yearMonth], (err, results, fields) => {
        if (err) {
          console.log(err);
          return res.status(400).send();
        }
        console.log(results)
        res.status(200).json(results);
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send();
    }
});

router.get("/monthly/welfare/sum-pending-payment/:date", (req, res) => {
  const date = req.params.date
  console.log(date)
  try {
    const mysql =
      "SELECT SUM(amount) AS TOTAL_PENDING_PAYMENT "+
      "FROM tbl_loan  "+
      "WHERE ? BETWEEN `startLoanDate` AND `endLoanDate`";
    connection.query(mysql, [date], (err, results, fields) => {
      if (err) {
        console.log(err);
        return res.status(400).send();
      }
      console.log(results)
      res.status(200).json(results);
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});

router.get("/yearly/welfare/summary/:year", (req, res) => {
    const year = req.params.year + '%'
    console.log('year = '+year)
    try {
      const mysql =
        "SELECT SUM(paymentAmount) AS TOTAL_PAYMENT, DATE_FORMAT(loanPaymentMonth, '%Y-%m') AS loanPaymentMonth "+
        "FROM tbl_loan_payment "+
        "WHERE loanPaymentMonth LIKE ? "+
        "GROUP BY DATE_FORMAT(loanPaymentMonth, '%Y%m')";
      connection.query(mysql, [year], (err, results, fields) => {
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
module.exports = router;
