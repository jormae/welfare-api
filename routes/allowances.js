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

router.get("/sum", (req, res) => {
  try {
    const mysql =
      "SELECT SUM(allowanceAmount) AS TOTAL_ALLOWANCE_BALANCE, "+ 
      "(SELECT SUM(allowanceAmount) FROM tbl_allowance al WHERE allowanceTypeId = 1) AS INCOME_ALLOWANCE,  "+
      "(SELECT SUM(allowanceAmount) FROM tbl_allowance al WHERE allowanceTypeId = 2) AS EXPENSE_ALLOWANCE  "+
      "FROM tbl_allowance a ";
    connection.query(mysql, [date, date, date], (err, results, fields) => {
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

router.get("/date/:date", (req, res) => {
  const date = req.params.date + '%'
  console.log(date)
  try {
    const mysql =
      "SELECT SUM(allowanceAmount) AS TOTAL_ALLOWANCE_BALANCE, "+
      "(SELECT SUM(allowanceAmount) FROM tbl_allowance al WHERE al.allowanceDateTime LIKE ? AND allowanceTypeId = 1) AS INCOME_ALLOWANCE, "+
      "(SELECT SUM(allowanceAmount) FROM tbl_allowance al WHERE al.allowanceDateTime LIKE ? AND allowanceTypeId = 2) AS EXPENSE_ALLOWANCE "+
      "FROM tbl_allowance a "+
      "WHERE a.allowanceDateTime LIKE ?";
    connection.query(mysql, [date, date, date], (err, results, fields) => {
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
    
    const { allowanceDateTime, allowanceTypeId, allowanceName, allowanceAmount, username } = req.body;
    const createdAt =  moment().format('YYYY-MM-DD H:m:s');
    const newAllowanceAmount = (allowanceTypeId == 2) ? '-'+allowanceAmount : allowanceAmount;

    try {
      connection.query(
        "INSERT INTO tbl_allowance(allowanceDateTime, allowanceTypeId, allowanceName, allowanceAmount, createdBy, createdAt) VALUES (?,?,?,?,?,?)",
        [allowanceDateTime, allowanceTypeId, allowanceName, newAllowanceAmount, username, createdAt],
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
