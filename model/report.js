var fs = require('fs');
var Course = require('./course')

class Report {

    static getCourseReportHtml(courseSubjectData){
        var resultHTML = `<head>
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css"
            integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous" />
        </head>`;
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
            <div>
                ${semesterHTML}
            </div>
        `

        return resultHTML;
    }

    static getSemesterHTML(years, semesterName, objList){
        var rows = "";

        for (var obj of objList){
            if (obj.data)
                rows += `
                    <div style="width:100%">
                        <span style="display: inline-block; width: 15%; border-bottom: 1px solid black;">${obj.data.subject_code}</span>
                        <span style="display: inline-block; width: 45%; border-bottom: 1px solid black;">${obj.data.subject_name_en}</span>
                        <span style="display: inline-block; width: 15%; border-bottom: 1px solid black;">${obj.data.credit}</span>
                        <span style="display: inline-block; width: 10%; border-bottom: 1px solid black;">${obj.data.grade}</span>
                    </div>
                `
            else
            rows += `
                <div style="width:100%; color:red;">
                    <span style="display: inline-block; width: 15%; border-bottom: 1px solid black;">${obj.subjectCode}</span>
                    <span style="display: inline-block; width: 45%; border-bottom: 1px solid black;">${obj.subjectName}</span>
                    <span style="display: inline-block; width: 15%; border-bottom: 1px solid black;">&nbsp;</span>
                    <span style="display: inline-block; width: 10%; border-bottom: 1px solid black;">&nbsp;</span>
                </div>
            `
        }
        
        return `
        <div className="CourseStructureForm col-6" style="margin-top:20;">
            <div class="card" style="width:100%;">
                <div class="card-body">
                    <h5 class="card-title">ปีที่ ${years} - ${semesterName}</h5>
                    <hr/>
                    
                    ${rows}
                </div>
            </div>
        </div>
        `
    }
}

module.exports = Report;