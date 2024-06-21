import jwt from 'jsonwebtoken';
import config from './config.js';

const autherizeMiddleware = (req,res,next) =>{
    const data = verifyToken(req.headers['authorization']);
    if(!data.valid){
        res.status(401).send('Unauthorized');
        return;
    }else{
        req.data = data.data;
        next();
    }
}

const getToken = (value, exp = null) =>{
    var jwtOptions = {};
    if(exp){
        jwtOptions.expiresIn = exp;
    }
    var token = jwt.sign(value, config.secureKey, jwtOptions);  
    //console.log(token);
    return token;
}

const verifyToken = (token) => {
    var result = {
        valid: false,
        data: null
    };
    try{
        token = (token + '').replace('Bearer ', '');
        //console.log(token);
        jwt.verify(token, config.secureKey, (err, data)=>{
            if(err){
                result.valid = false;
            }else{
                result.valid = true;
                result.data = data;
            }
        });
    }catch(err){
        console.log(err);
    }
    return result;
};

export default {autherizeMiddleware, getToken, verifyToken};