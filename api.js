const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const express = require('express')
const app = express();
const Course = require('./model/course');
const DB = require('./model/db');
const Expression = require('./model/expression');
const fs = require('fs');
const pdf = require('html-pdf');

app.use(express.json());
app.use(express.static('public'))

const PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAytOhlq/JPcTN0fX+VqObE5kwIaDnEtso2KGHdi9y7uTtQA6pO4fsPNJqtXOdrcfDgp/EQifPwVRZpjdbVrD6FgayrQQILAnARKzVmzwSMDdaP/hOB6i9ouKsIhN9hQUmUhbhaMkh7UXoxGW+gCSK8dq0+FJVnlt1dtJByiVAJRi2oKSdLRqNjk8yGzuZ6SrEFzAgYZwmQiywUF6V1ZaMUQDz8+nr9OOVU3c6Z2IQXCbOv6S7TAg0VhriFL18ZxUPS6759SuKC63VOOSf4EEHy1m0qBgpCzzlsB7D4ssF9x0ZVXLREFrqikP71Hg6tSGcu4YBKL+VwIDWWaXzz6szxeDXdYTA3l35P7I9uBUgMznIjTjNaAX4AXRsJcN9fpF7mVq4eK1CorBY+OOzOc+/yVBpKysdaV/yZ+ABEhX93B2kPLFSOPUKjSPK2rtqE6h2NSl5BFuGEoVBerKn+ymOnmE4/SDBSe5S6gIL5vwy5zNMsxWUaUF5XO9Ez+2v8+yPSvQydj3pw5Rlb07mAXcI18ZYGClO6g/aKL52KYnn1FZ/X3r8r/cibfDbuXC6FRfVXJmzikVUqZdTp0tOwPkh4V0R63l2RO9Luy7vG6rurANSFnUA9n842KkRtBagQeQC96dbC0ebhTj+NPmskklxr6/6Op/P7d+YY76WzvQMvnsCAwEAAQ==\n-----END PUBLIC KEY-----"

Expression.loadGroups();

app.post('/login', async (req, res, next) => {
  const encryptedData1 = crypto.publicEncrypt(
    {
      key: PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    // We convert the data string to a buffer using `Buffer.from`
    Buffer.from(req.body.username)
  );
  
  const encryptedData2 = crypto.publicEncrypt(
    {
      key: PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    // We convert the data string to a buffer using `Buffer.from`
    Buffer.from(req.body.password)
  );
  
  var data = qs.stringify({
    'username': encryptedData1.toString("base64"),
    'password': encryptedData2.toString("base64")
  });
  var config = {
    headers: {
        "app-key": 'txCR5732xYYWDGdd49M3R19o1OVwdRFc',
    },
  };

  await axios
    .post("https://myapi.ku.th/auth/login", data, config)
    .then(function (response) {
        accesstoken = response.data.accesstoken;
        stdId = response.data.stdId;
        idCode = response.data.idCode;

        res.status(200).send({'accesstoken': accesstoken, 'data': response.data});
    })
    .catch(function (error) {
        res.status(400).send({'error': error.response.data.message});
    });

})

// console.log(encryptedData1.toString("base64"));
// console.log("\n------------------------------------\n");
// console.log(encryptedData2.toString("base64"));

app.get('/gpax', async (req, res, next) => {
  const accesstoken = req.headers.accesstoken;

  var config = {
    headers: {
        "app-key": 'txCR5732xYYWDGdd49M3R19o1OVwdRFc',
        "x-access-token": accesstoken,
    },
  };

  await axios
    .get("https://myapi.ku.th/stddashboard/gpax", config)
    .then(function (response) {
        console.log("response")
        res.status(200).send({'data': response.data});
    })
    .catch(function (error) {
        console.log("error")
        // res.status(400).send({'error': error.response.data.message});
        res.status(400).send({'error': error.response.data.message});
    });
})

app.get('/grades', async (req, res, next) => {
  const accesstoken = req.headers.accesstoken;

  var config = {
    headers: {
        "app-key": 'txCR5732xYYWDGdd49M3R19o1OVwdRFc',
        "x-access-token": accesstoken,
    },
  };

  await axios
    .get("https://myapi.ku.th/std-profile/checkGrades", config)
    .then(function (response) {
        console.log("response")
        var results = response.data.results;
        var grades = [];

        for (let gradeList of results){
          for (let grade of gradeList){
            grades.push(grade);
          }
        }

        //...dosomething

        res.status(200).send({'data': grades});
    })
    .catch(function (error) {
        console.log("error")
        // res.status(400).send({'error': error.response.data.message});
        res.status(400).send({'error': error.response.data.message});
    });
})

app.get('/grades-example', async (req, res, next) => {
  let course = await DB.getCourseExample();
  let gradesRaw = await DB.getGradesExample();
  var grades = [];

  // console.log(gradesRaw);

  for (let gradeList of gradesRaw.data.results){
    for (let grade of gradeList.grade){
      grades.push(grade);
    }
  }

  let result = await course.fillSubject(grades);
  res.send(result);
});

const port = 3000;

app.post('/add-course', async (req, res, next) => {
  var obj = req.body.course;
  var result = DB.writeCourse(obj.nameDepartment, obj.startYear, obj);
  
  if (result)
    res.send('success');
  else
    res.send('error');
})

app.get('/subject-groups', async (req, res, next) => {
  var result = [];
  for (var key in Expression.GROUPS){
    result.push({
      "idName": Expression.GROUPS[key].idName, 
      "name": Expression.GROUPS[key].name,
    })
  }
  res.send(result);
});

app.get('/get-course-data', async (req, res, next) => {
  let course = await DB.getCourse('D14', '2560');
  let gradesRaw = await DB.getGradesExample();
  var grades = [];

  for (let gradeList of gradesRaw.data.results){
    for (let grade of gradeList.grade){
      grades.push(grade);
    }
  }

  let result = await course.fillSubject(grades);
  res.send(result);
});

app.get('/test', async (req, res, next) => {
  pdf.create("<h1>555555+</h1>").toFile('data/pdf_print/test.pdf', function(err, result){
    console.log(result.filename);
    res.send("test");
  });
});


/*
  convert วิชาทั่วไป to ExpressionGroups
*/
// app.get('/convert-to-expression-groups', async (req, res, next) => {
//   let rawdata = fs.readFileSync('data/GEN.json');
//   let data = JSON.parse(rawdata);
//   var result = [];

//   for (var key in data){
//     if (data[key].subtype=="อื่น ๆ" && data[key].type=="พลเมืองไทยและพลเมืองโลก")
//     // if (data[key].type=="พลเมืองไทยและพลเมืองโลก")
//       result.push({name:key, pattern:key, type:"regex"});
//   }

//   await Expression.writeGroup("thai-citizen-and-global-citizen-others", "พลเมืองไทยและพลเมืองโลก", result);

//   res.send(result);
// });


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})