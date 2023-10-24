const express = require("express");
const connection = require("../config/database-connection");
const router = express.Router();
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator");
const { query } = require("express");
const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Bangkok");

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

router.get("/", (req, res) => {
  try {
    const mysql = "SELECT *, SUM(totalShare) AS TOTAL_SHARE "+
    "FROM tbl_member m  "+
    "LEFT JOIN tbl_member_role mr ON mr.memberRoleId = m.memberRoleId  "+
    "LEFT JOIN tbl_member_type mt ON mt.memberTypeId = m.memberTypeId  "+
    "LEFT JOIN tbl_payment_type pt ON pt.paymentTypeId = m.paymentTypeId  "+
    "LEFT JOIN tbl_position p ON p.positionId = m.positionId  "+
    "LEFT JOIN tbl_spouse s ON s.memberNationalId = m.nationalId "+ 
    "LEFT JOIN tbl_investment i ON i.nationalId = m.nationalId  "+
    "LEFT JOIN tbl_member_status ms ON ms.memberStatusId = m.memberStatusId "+
    "GROUP BY m.nationalId  "+
    "ORDER BY memberName";
    connection.query(
      mysql, (err, results, fields) => {
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
}
);

router.get("/:nationalId", async (req, res) => {
  const nationalId = req.params.nationalId;
  try {
    connection.query(
      "SELECT * "+
      "FROM tbl_member m "+
      "LEFT JOIN tbl_member_role mr ON mr.memberRoleId = m.memberRoleId "+
      "LEFT JOIN tbl_member_type mt ON mt.memberTypeId = m.memberTypeId "+
      "LEFT JOIN tbl_payment_type pt ON pt.paymentTypeId = m.paymentTypeId "+
      "LEFT JOIN tbl_position p ON p.positionId = m.positionId "+
      "LEFT JOIN tbl_spouse s ON s.memberNationalId = m.nationalId "+
      "WHERE m.nationalId = ?",
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
router.post(
  "/",
  body("nationalId").custom((value, { req }) => {
    return new Promise((resolve, reject) => {
      const nationalId = req.body.nationalId;
      connection.query(
        "SELECT nationalId FROM tbl_member WHERE nationalId = ? ",
        [nationalId],
        (err, res) => {
          if (err) {
            reject(new Error("Server Error"));
          }
          if (res.length > 0) {
            reject(new Error("nationalId is already existed!"));
          }
          resolve(true);
        }
      );
    });
  }),
  async (req, res) => {
    const {nationalId,
      memberName,
      houseNo,
      streetName,
      villageName,
      villageNo,
      subDistrict,
      district,
      province,
      postCode,
      contactNo,
      positionId,
      salary,
      paymentTypeId,
      memberTypeId,
      memberRoleId,
      memberStatusId,
      shareQuantity, 
      valuePerShare, 
      totalShare,
      isHealthInsurance,
      username} = req.body;
  const datetime =  moment().format('YYYY-MM-DD H:m:s');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    try {
      connection.query(
        "INSERT INTO tbl_member(memberName, houseNo, streetName, villageName, villageNo, "+
        "subDistrict, district, province,postCode, contactNo, positionId, "+
        "salary, paymentTypeId,memberTypeId, memberRoleId, memberStatusId, isHealthInsurance, nationalId) "+
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [memberName, houseNo, streetName, villageName, villageNo, subDistrict, district, province,postCode, contactNo, positionId,
          salary, paymentTypeId,memberTypeId, memberRoleId, memberStatusId, isHealthInsurance, nationalId],
        (err, results, fields) => {
          if (err) {
            console.log("Error while inserting a member into database!", err);
            return res.status(400).send();
          }
          connection.query("INSERT INTO tbl_spouse(memberNationalId) VALUES (?)", nationalId);
          connection.query(
            "INSERT INTO tbl_investment(investmentTypeId, shareQuantity, valuePerShare, totalShare, nationalId, investmentDateTime, createdAt, createdBy, investmentStatusId, approvedAt, approvedBy) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            [1, shareQuantity, valuePerShare, totalShare, nationalId, datetime, datetime, username, 1, datetime, username]);
          return res
            .status(201)
            .json({ status: "success", message: "บันทึกการเพิ่มสมาชิกใหม่เรียบร้อยแล้ว!" });
        }
      );
    } catch (err) {
      console.log(err);
      return res.status(500).send();
    }
  }
);

router.put("/:nationalId", async (req, res) => {
  const {
   memberName,
   houseNo,
   streetName,
   villageName,
   villageNo,
   subDistrict,
   district,
   province,
   postCode,
   contactNo,
   positionId,
   salary,
   paymentTypeId,
   memberTypeId,
   memberRoleId,
   memberStatusId,
   isHealthInsurance,
   resignDate } = req.body;
   const nationalId = req.params.nationalId
  try {
    connection.query(
      "UPDATE tbl_member SET memberName = ?, houseNo = ?, streetName = ?, villageName = ?, villageNo = ?, subDistrict = ?, "+
      "district = ?, province = ?, postCode = ?, contactNo = ?, positionId = ?, salary = ?, paymentTypeId = ?, memberTypeId = ?, "+
      "memberRoleId = ?, memberStatusId = ?,  isHealthInsurance = ?, resignDate = ? WHERE nationalId = ? ",
      [memberName, houseNo, streetName, villageName, villageNo, subDistrict, district, province,postCode, contactNo, positionId,
        salary, paymentTypeId,memberTypeId, memberRoleId, memberStatusId, isHealthInsurance, resignDate, nationalId],
      (err, results, fields) => {
        if (err) {
          console.log("Error while updating a member in database!", err);
          return res.status(400).send();
        }
        return res
          .status(200)
          .json({status:'success', message: "บันทึกข้อมูลสมาชิกสำเร็จ!" });
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});

module.exports = router;
