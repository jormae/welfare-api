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

router.get("/:nationalId", async (req, res) => {
  const nationalId = req.params.nationalId;
  try {
    connection.query(
      "SELECT * " +
        "FROM tbl_investment i " +
        "LEFT JOIN tbl_investment_type it ON it.investmentTypeId = i.investmentTypeId " +
        "WHERE nationalId = ?",
      [nationalId],
      (err, results, fields) => {
        if (err) {
          console.log(err);
          return res.status(400).send();
        }
        res.status(200).json(results);
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});

router.get("/summary/:nationalId", async (req, res) => {
  const nationalId = req.params.nationalId;
  try {
    connection.query(
     "SELECT i.nationalId, memberName, SUM(shareQuantity) AS totalShareQuantity, SUM(totalShare) AS totalShare "+ 
        "FROM tbl_investment i  "+
        "LEFT JOIN tbl_member m ON m.nationalId = i.nationalId  "+
        "WHERE i.nationalId = ?",
      [nationalId],
      (err, results, fields) => {
        if (err) {
          console.log(err);
          return res.status(400).send();
        }
        res.status(200).json(results);
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});

// post
router.post("/", async (req, res) => {

  const { investmentTypeId, nationalId,  shareQuantity, valuePerShare, username } = req.body;
  const totalShare = shareQuantity * valuePerShare
  const datetime =  moment().format('YYYY-MM-DD H:m:s');

  let strShareQuantity, strTotalShare;
    if(investmentTypeId == 1){
       strShareQuantity = shareQuantity
       strTotalShare = shareQuantity * valuePerShare
    }
    else{
       strShareQuantity = '-'+shareQuantity
       strTotalShare = '-'+shareQuantity * valuePerShare
    }

    try {
      connection.query(
        "INSERT INTO tbl_investment(investmentTypeId, shareQuantity, valuePerShare, totalShare, nationalId, investmentDateTime, createdAt, createdBy) VALUES (?,?,?,?,?,?,?,?)",
        [investmentTypeId, strShareQuantity, valuePerShare, strTotalShare, nationalId, datetime, datetime, username],
        (err, results, fields) => {
          if (err) {
            console.log("Error while inserting a dept into database!", err);
            return res.status(400).send();
          }
          return res
            .status(201)
            .json({ status: 'success', message: "บันทึกข้อมูลการเพิ่ม/ถอน/ลา หุ้น เรียบร้อยแล้ว!" });
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
