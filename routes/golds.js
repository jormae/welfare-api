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
      "FROM tbl_gold  "+
      "ORDER BY goldDateTime DESC";
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
      "SELECT SUM(goldAmount) AS TOTAL_GOLD_BALANCE, "+ 
      "(SELECT SUM(goldAmount) FROM tbl_gold al WHERE goldTypeId = 1) AS INCOME_GOLD,  "+
      "(SELECT SUM(goldAmount) FROM tbl_gold al WHERE goldTypeId = 2) AS EXPENSE_GOLD  "+
      "FROM tbl_gold a ";
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
    
    const { goldDateTime, goldTypeId, goldName, goldAmount, username } = req.body;
    const createdAt =  moment().format('YYYY-MM-DD H:m:s');
    const newGoldAmount = (goldTypeId == 2) ? '-'+goldAmount : goldAmount;

    try {
      connection.query(
        "INSERT INTO tbl_gold(goldDateTime, goldTypeId, goldName, goldAmount, createdBy, createdAt) VALUES (?,?,?,?,?,?)",
        [goldDateTime, goldTypeId, goldName, newGoldAmount, username, createdAt],
        (err, results, fields) => {
          if (err) {
            console.log("Error :: บันทึกข้อมูลส่วนต่างราคาทองล้มเหลว!", err);
            return res.status(400).send();
          }
          return res
            .status(201)
            .json({ status: 'success', message: "บันทึกข้อมูลส่วนต่างราคาทองเรียบร้อยแล้ว!" });
        }
      );
    } catch (err) {
      console.log(err);
      return res.status(500).send();
    }
  }
);

router.delete("/:goldId", async (req, res) => {
  const goldId = req.params.goldId;
  try {
    connection.query(
      "DELETE FROM tbl_gold WHERE goldId = ?",
      [goldId],
      (err, results, fields) => {
        if (err) {
          console.log("Error while deleting a gold in database!", err);
          return res.status(400).send();
        }
        return res
          .status(200)
          .json({ status:"success", message: "ลบข้อมูลรายการทองเรียบร้อยแล้ว!" });
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});

module.exports = router;
