class Course {
    constructor(nameDepartment, startYear, category = []) {
        this.nameDepartment = nameDepartment;
        this.startYear = startYear;
        this.category = category;
    }

    addCategories(listCategory) {
        this.category = listCategory;
    }

    fillSubject(subjectList){
        
    }
}

module.exports = Course;