var fs = require('fs');
var Course = require('./course')

class Report {

    static getCourseReportHtml(courseSubjectData){
        var resultHTML = `<html lang="en"><head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <!-- Bootstrap CSS -->
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css"
                integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous" />
            <title>เข้าสู่ระบบ KU</title>
            <script type="application/javascript" src="https://unpkg.com/react@16.0.0/umd/react.production.min.js"></script>
            <script type="application/javascript" src="https://unpkg.com/react-dom@16.0.0/umd/react-dom.production.min.js"></script>
            <script type="application/javascript" src="https://unpkg.com/babel-standalone@6.26.0/babel.js"></script>  
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
            <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
            <script src="https://cdn.jsdelivr.net/npm/popper.js@1.12.9/dist/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>    
            <link rel="stylesheet" href="css/styles.css">
        </head><body>`;
        var semesterHTML = ""

        for(let i=0; i<courseSubjectData.numberOfYear; i++){
            semesterHTML += Report.getSemesterHTML(i+1, "ภาคต้น", courseSubjectData.semesterYears[i].firstSemester)
            semesterHTML += Report.getSemesterHTML(i+1, "ภาคปลาย", courseSubjectData.semesterYears[i].secondSemester)
        }

        // function createCategoryHtml(listCategory){
        //     for (var category of listCategory) {
        //         if (category.expression == null)
        //             continue;
                
        //         //category.subjects
        //         //dosomething

        //         if (category.subCategory.length > 0){
        //             createCategoryHtml(category.subCategory);
        //         }
        //     }
        // }
        // createCategoryHtml(courseSubjectData.category);

        resultHTML += `
            <div style="width:800px;">
                ${semesterHTML}
            </div>
            </body></html>
        `
        return resultHTML;
    }

    static getSemesterHTML(years, semesterName, objList){
        var rows = "";

        for (var obj of objList){
            if (obj.data)
                rows += Report.getSemesterRow(
                    "normal",
                    obj.data.subject_code, 
                    obj.data.subject_name_en, 
                    obj.data.credit, 
                    obj.data.grade)
            else
                rows += Report.getSemesterRow(
                    "red",
                    obj.subjectCode, 
                    obj.subjectName,
                    "&nbsp;",
                    "&nbsp;")
        }
        
        return `
        <div className="CourseStructureForm" style="margin-top:20;display:inline-block;width:49%;font-size:8pt">
            <div class="card">
                <div class="card-body" style="height:200px;">
                    ${Report.getSemesterRow(
                        "normal", 
                        `ปีที่ ${years}`,
                        `${semesterName}`,
                        "นก.",
                        "เกรด",
                        "#DCDCDC")}
                    ${rows}
                </div>
            </div>
        </div>
        `
    }

    static getSemesterRow(color="normal", col1, col2, col3, col4, backgroundColor="white"){
        return `
            <div style="width:100%; color:${color};">
                <span style="display: inline-block; width: 15%; border-bottom: 1px solid black;background:${backgroundColor};">${col1}</span>
                <span style="display: inline-block; width: 65%; border-bottom: 1px solid black;background:${backgroundColor};">${col2}</span>
                <span style="display: inline-block; width: 8%; border-bottom: 1px solid black;text-align:center;background:${backgroundColor};">${col3}</span>
                <span style="display: inline-block; width: 8%; border-bottom: 1px solid black;text-align:center;background:${backgroundColor};">${col4}</span>
            </div>
        `
    }
}

module.exports = Report;