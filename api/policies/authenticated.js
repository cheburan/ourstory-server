/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * Allow any authenticated user.
 */

function isValidReferer(req)
{
  // console.log(req.headers);
  // return false;
  // console.log(req.header('host') == 'localhost')
  return req.header('host') == 'localhost' || _.includes(req.header('referer'),'localhost');
}

module.exports = function (req, res, ok) {

  //check its from localhost:
  // console.log(isValidReferer(req));
  if (sails.config.LOCALONLY && isValidReferer(req))
  {
    //check its not from mobile:
    // console.log(req.headers);

    // console.log('IS VALID LOCAL ADMIN');
    
    req.session.api = false;
		req.session.ismobile = true;
    req.session.isios = true;
    // res.locals.rtl = false;
		User.findOrCreate({
      localadmin:true
    },
    {
      localadmin:true,
      consent: new Date(),
      nolimit:1,
      profile: {
        displayName: sails.__('Director'),
        provider: 'local',
        photos: [
          {
            value: sails.config.master_url + '/images/user.png'
          }
        ],
        emails: [
          {
            value: 'localadmin@ourstory.video'
          }
        ]
      }
    }, function (err, user) {
      req.session.passport.user = user;
      // console.log(err)
			// req.logIn(user, function (done) {
        return ok();
			// });
		});
  }
  else
  {
    
    //if the request has a servertoken (i.e. its operating on behalf of another user...)
    if (req.param('servertoken'))
    {
      //has a server token
      User.findOne({'apikey.servertoken':req.param('servertoken')}).exec(function(err,user){
        if (user)
        {
          //do headless login using this user:
          req.session.passport.user = user;
          return ok();
        }
        else
        {
          return res.json(403,{msg:"Invalid server token"});
        }
      });
    }
    else
    {

    // User is allowed, proceed to controller
    if (req.session.passport && req.session.passport.user) {

      if (req.options.action=='acceptconsent' || req.options.action=='consent')
      {
        return ok();
      }
      else
      {

        //GDPR adjustments:
        if (!req.session.passport.user.consent)
        {
          if (req.wantsJSON)
          {
            return res.status(500).json({
              msg:'Privacy consent required'
            })
          }
          else
          {
            //send to consent:
            return res.redirect('/consent');
          }
        }
        else
        {
          return ok();
        }
      }
    }
    else {
      // User is not allowed
        // console.log('not allowed')
        // console.log(req.session);
        if (req.wantsJSON)
        {
          // console.log('forbidden');
          return res.status(403).json({msg:"You are not permitted to perform this action."});
        }
        else
        {
          if (sails.config.LOCALONLY && isValidReferer(req))
          {
            req.session.flash = {msg:sails.__('No can do, sorry.')};
            //console.log("not authorized");
            return res.redirect('auth/login');
          }
          else{
            res.locals.localmode = sails.localmode;
            res.locals.inspect = require('util').inspect;
            res.locals.moment = require('moment');
            res.locals.user = '';
            res.locals.flash = '';
          
            if (!res.locals.event)
            {
              res.locals.event = {name:''};
            }
            return res.status(403).view('notlocal');
          }
        }
      }
    }
  }
};