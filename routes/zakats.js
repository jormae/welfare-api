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
      "FROM tbl_zakat z "+
      "LEFT JOIN tbl_zakat_type zt ON zt.zakatTypeId = z.zakatTypeId "
      "ORDER BY zakatId DESC";
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
      "SELECT SUM(zakatAmount) AS TOTAL_ZAKAT_BALANCE, "+ 
      "(SELECT SUM(zakatAmount) FROM tbl_zakat al WHERE zakatTypeId = 1) AS INCOME_ZAKAT,  "+
      "(SELECT SUM(zakatAmount) FROM tbl_zakat al WHERE zakatTypeId = 2) AS EXPENSE_ZAKAT  "+
      "FROM tbl_zakat a ";
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
    
    const { zakatDateTime, zakatTypeId, zakatName, zakatAmount, username } = req.body;
    const createdAt =  moment().format('YYYY-MM-DD H:m:s');
    const newZakatAmount = (zakatTypeId == 2) ? '-'+zakatAmount : zakatAmount;

    try {
      connection.query(
        "INSERT INTO tbl_zakat(zakatDateTime, zakatTypeId, zakatName, zakatAmount, createdBy, createdAt) VALUES (?,?,?,?,?,?)",
        [zakatDateTime, zakatTypeId, zakatName, newZakatAmount, username, createdAt],
        (err, results, fields) => {
          if (err) {
            console.log("Error :: บันทึกข้อมูลซากาตล้มเหลว!", err);
            return res.status(400).send();
          }
          return res
            .status(201)
            .json({ status: 'success', message: "บันทึกข้อมูลซากาตเรียบร้อยแล้ว!" });
        }
      );
    } catch (err) {
      console.log(err);
      return res.status(500).send();
    }
  }
);

router.delete("/:zakatId", async (req, res) => {
  const zakatId = req.params.zakatId;
  try {
    connection.query(
      "DELETE FROM tbl_zakat WHERE zakatId = ?",
      [zakatId],
      (err, results, fields) => {
        if (err) {
          console.log("Error while deleting a zakat in database!", err);
          return res.status(400).send();
        }
        return res
        .status(200)
        .json({ status:"success", message: "ลบข้อมูลรายการซากาตเรียบร้อยแล้ว!" });
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});

module.exports = router;
