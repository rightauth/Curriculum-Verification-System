var fs = require('fs');
var Course = require('./course')

class Report {

    static async getCourseReportHtml(courseSubjectData){
        function createCategoryHtml(listCategory){
            for (var category of listCategory) {
                if (category.expression == null)
                    continue;
                
                //category.subjects
                //dosomething

                if (category.subCategory.length > 0){
                    createCategoryHtml(category.subCategory);
                }
            }
        }
        createCategoryHtml(courseSubjectData.category);

        return objData;
    }

}

module.exports = Report;