/*
Name of the author:MONISHA MOHAN
Date of creation:13/08/2019
Project Name :PHANTOM
Function Details:Module contains the functions to handle the cognito- user creation
*/



module.exports = {
    email: (email) => {
        var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(String(email).toLowerCase());
    },
    // role:(data)=>{
    //     const role=data.role;
    //     if(role==='Executive Global')
    //         if (against && against.length) {
    //             against.forEach(section => {
    //                 if (section && section.element) {
    //                     if (!data[section.element]) {
    //                         errors.push({
    //                             error: `${section.element} is Invalid`
    //                         });
    //                     }
    //                 }
    //             })
    //         }
    //         return errors;
    //     },
    
    // }
}

