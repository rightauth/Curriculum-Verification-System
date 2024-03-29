var fs = require('fs');
var Course = require('./course')

class DB {

    static async getCourseExample(){
        let rawdata = fs.readFileSync('data/mock_up_data/course.json');
        let data = JSON.parse(rawdata);
        let objData = Course.jsonToObj(data);

        return objData;
    }

    static async getGradesExample(){
        let rawdata = fs.readFileSync('data/mock_up_data/grades.json');
        let data = JSON.parse(rawdata);

        return data;
    }

    static async getCourse(nameDepartment, startYear){
        try {
            let rawdata = fs.readFileSync(`data/course/${nameDepartment}-${startYear}.json`);
            let data = JSON.parse(rawdata);
            let objData = Course.jsonToObj(data);

            return objData;
        } catch(e) {
            return {};
        }
    }

    static async writeCourse(name, startYear, objdata){
        fs.writeFile(`data/course/${name}-${startYear}.json`, JSON.stringify(objdata), function(err) {
            if (err) {
                console.log(err);
                return false;
            } else {
                return true;
            }
        });
    }

    static deleteCourse(name, startYear){
        try {
            fs.unlinkSync(`data/course/${name}-${startYear}.json`);
            return true;
        }catch(e){
            return false;
        }
    }
}

module.exports = DB;