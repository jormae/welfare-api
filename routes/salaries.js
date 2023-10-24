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

router.get("/date/:date", async (req, res) => {
  const date = req.params.date;
//   const healthInsurance = req.params.healthInsurance;
  try {
    connection.query(
      "SELECT *, "+
      "(SELECT (houseRent+bank+studentLoan+allowance) FROM tbl_debt d WHERE d.nationalId = m.nationalId AND d.yearMonth = ? ) AS debts "+
      "FROM tbl_member m "+
      "WHERE m.memberStatusId = 1 "+
      "AND m.isHealthInsurance = 1 "+
      "ORDER BY memberName ASC",
      [date],
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

router.get("/report/:date", async (req, res) => {
  const date = req.params.date;
  try {
    connection.query(
      "SELECT * "+
      "FROM tbl_salary s "+
      "LEFT JOIN tbl_member m ON m.nationalId = s.nationalId "+
      "LEFT JOIN tbl_member_role mr ON mr.memberRoleId = m.memberRoleId "+
      "LEFT JOIN tbl_member_type mt ON mt.memberTypeId = m.memberTypeId "+
      "LEFT JOIN tbl_payment_type pt ON pt.paymentTypeId = m.paymentTypeId "+
      "LEFT JOIN tbl_position p ON p.positionId = m.positionId "+
      "WHERE salaryMonth = ? "+
      "ORDER BY memberName ASC",
      [date],
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
  body("date").custom((value, { req }) => {
    return new Promise((resolve, reject) => {
      const date = req.body.date;
      connection.query(
        "SELECT * FROM tbl_salary WHERE salaryMonth = ? ",
        [date],
        (err, res) => {
          if (err) {
            reject(new Error("Server Error"));
          }
          if (res.length > 0) {
            reject(new Error("บันทึกข้อมูลบัญชีการจ่ายเงินเดือนบุคลากรซ้ำ!"));
          }
          resolve(true);
        }
      );
    });
  }),
  async (req, res) => {
    const {date,
      healthInsurance,
      memberName} = req.body;
      console.log(req.body);
  const datetime =  moment().format('YYYY-MM-DD H:m:s');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
         status: "error", message: "บันทึกข้อมูลบัญชีการจ่ายเงินเดือนบุคลากรซ้ำ!" 
      });
    }
    try {
      connection.query(
        "SELECT *, "+
        "(SELECT (houseRent+bank+studentLoan+allowance) FROM tbl_debt d WHERE d.nationalId = m.nationalId AND d.yearMonth = ? ) AS debts "+
        "FROM tbl_member m "+
        "WHERE m.memberStatusId = 1 "+
        "AND m.isHealthInsurance = 1 ", date,
        (err, results, fields) => {
          if (err) {
            console.log("บันทึกข้อมูลเงินเดือนล้มเหลว", err);
            return res.status(400).send();
          }
          for(i=0; i<results.length; i++){
            let paramSalary = results[i]['salary'] > 15000 ? 15000 : results[i]['salary'];
            let paramHealthInsurance = healthInsurance * paramSalary;
            let netSalary = results[i]['salary'] - results[i]['debts'] - paramHealthInsurance;
            connection.query("INSERT INTO tbl_salary (salaryMonth, nationalId, basedSalary, healthInsurancePercentage, healthInsurance, debts, netSalary, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [date, results[i]['nationalId'], results[i]['salary'], healthInsurance, paramHealthInsurance, results[i]['debts'], netSalary, datetime, memberName]);
          }

          return res
            .status(201)
            .json({ status: "success", message: "บันทึกข้อมูลเงินเดือนเรียบร้อยแล้ว!" });
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
   resignDate } = req.body;
   const nationalId = req.params.nationalId
  try {
    connection.query(
      "UPDATE tbl_member SET memberName = ?, houseNo = ?, streetName = ?, villageName = ?, villageNo = ?, subDistrict = ?, "+
      "district = ?, province = ?, postCode = ?, contactNo = ?, positionId = ?, salary = ?, paymentTypeId = ?, memberTypeId = ?, "+
      "memberRoleId = ?, memberStatusId = ?, resignDate = ? WHERE nationalId = ? ",
      [memberName, houseNo, streetName, villageName, villageNo, subDistrict, district, province,postCode, contactNo, positionId,
        salary, paymentTypeId,memberTypeId, memberRoleId, memberStatusId, resignDate, nationalId],
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
