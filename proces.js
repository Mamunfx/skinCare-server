/**
 * -------------------
 *          JWT
 * -------------------
 * install jsonwebtoken cookie-parser---
 * set cookieParser as middleware
 * 
 * const cookieParser = require("cookie-parser");
 * 
 * const jwt = require('jsonwebtoken');
 * 
 * 1. create a token---
 * # make a secret
 * require('crypto').randomBytes(64).toString('hex')
 * 
 * // Auth related apis:
      app.post('/JWT',(res,req)=>{
        const user=req.body;
        const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn : '5h'});
        res
           .cookie('token',token,{
            httpOnly: true,
            secure: false
           })
           .send({success:true});
      });
 * 
 * set token to the cookie of res.cookie('token', token, {
 *      httpOnly: true,
 *      secure: false
 * }).send({})
 * 
 * 
 * 2. change Auth things and post token to server side ---
 * 
 *  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {

      if (currentUser?.email) {
        const user = {email: currentUser.email};
        axios.post('http://localhost:5001/JWT',user)
        .then(res=> console.log(res.data))
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
 * 
 * 
 * cors({
 *  origin: [''],
 *   credentials: true
 * })
 * 
 * client: {
 *  withCredentials: true
 * }
 * 
 * 
 * Finnally it AuthChange will look like :
 * 
 *  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      
      if (currentUser?.email) {
        const user = {email: currentUser.email};
        axios.post('http://localhost:5001/JWT',user,{
          withCredentials:true
        })
        .then(res=> console.log(res.data))
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
 * 
 * 
 * 3.Log out er shomoy token clear korar kaz ----
 *  //make a logout endpoint in the server
 *  app.post('/logout', (req, res) => {
    res.clearCookie('token', {
    httpOnly: true,
    secure: false // set to true if using https
  }).send({ success: true });
   });


 * then fetch it in the AuthChange in client side :

       useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      
      if (currentUser?.email) {
        const user = {email: currentUser.email};
        axios.post('http://localhost:5001/JWT',user,{
          withCredentials:true
        })
        .then(res=> {
          console.log('login token',res.data);
          setLoading(false)
        })
      }
      else{
        axios.post('http://localhost:5001/logout',{},{
          withCredentials:true
        })
        .then(res=>{
          console.log('logout',res.data);
          setLoading(false)
        })
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
 * 
 * . send the token to the client side. make sure token is in the cookies (application)
 * 
 * 4. Verify token in the client side by creating middleware and using that to server endpoint--
 * 
 * // JWT token verification middleware 
  const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};
 *
 * make sure you use verify token in between the server end point :
 * app.get("/queries", verifyToken, async (req, res) => {
 * }
 * 
 * and when fetching data in the client side remember to use withCredentials:true :
 * const response = await axios.get('http://localhost:5001/queries',{
          withCredentials:true
        });
 *  or
    const responce = await axiosInstance.get('/queries')    
 *
 * // you can make a custom hook to make life much easier one example is given below : 
 * 
 * 
 * 
 * 
*/