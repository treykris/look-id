const router = require('express').Router();
const models = require('../models/schemas');


// User's Main Profile Page
router.get('/:user', (req, res) => {
    

    const query = {
       username: req.params.user
   };
   

   models.Users.findOne(query)
   .then( (user) => {

        if(!user) res.status(404).send('Page does not exist');

        let iFollow = false;

       if(req.isAuthenticated()){
            for(let me of user.followers){
        
                if(req.user.username === me.username){
                    iFollow = true;
                    
                }
            }
        }

       const neededData = {
           followerCount: user.followers.length,
           followingCount: user.following.length,
           bio: user.profile.bio,
           website: user.profile.website,
           avatar: user.profile.avatar,
           posts: user.posts,
           username: user.username,
           iFollow: iFollow
       };


        models.Posts.find(query).then((data) => {

            neededData.posts = data;

            console.log(data);
            res.json({success: true, user: neededData});
        });
   })
   .catch( (err) => {
       res.json({success: false});
       console.log(err);
   });

});

// User's Post Page
router.get('/:user/:postid', (req, res) => {
    const query = {
       username: req.params.user
    };
    const postID = req.params.postid;


    // Search through all the user's post to get the specific post and to create 'Other Posts' section
    models.Posts.find(query).then((posts) => {

        let requestedPostData;
       
        // Get the needed post
        posts.forEach((post) => {
            if(post.post_id === postID){
                if(!post.post_id) res.status(404).send('Page does not exist');
                requestedPostData = post;
            }
        });

        // Make 'Other Posts' Section, filter out the post that is requested
        // const otherPosts = posts.filter((post) => post.post_id !== postID);
        models.Posts.find({post_id: {$ne: postID}}, {post_id: 1, image: 1})
        .then((otherPosts) => {
            res.json({post: requestedPostData, otherPosts: otherPosts});
        });
   })
   .catch( (err) => {
        console.log(err);
        res.status(415).json({success: false});
   });

});

// Get User's Like
router.get('/:user/:postid/likes', (req, res) => {

    const query = {
       post_id: req.params.postid
    };
    
    // Get requested posts for likes
    models.Posts.findOne(query).then((posts) => {

        let iLiked = false;
        const likeCount = posts.likes.length;

        // Check to see if user liked the requested post already
        if(req.isAuthenticated()){
            posts.likes.forEach((username) => {
                if(req.user.username === username) iLiked = true;
            });
        }

        res.json({iLiked: iLiked, likeCount: likeCount});
   })
   .catch( (err) => {
        console.log(err);
        res.status(500).json({success: false});
   });

});

// Liking a user's post
router.post('/:user/:postid/likes', (req, res) => {

    const query = {
        'post_id': req.params.postid
    };
    const liked = req.body.iLiked;
    let performUpdateAction;

    liked ? 
            performUpdateAction = { $pull: {'likes': req.user.username} } 
            : 
            performUpdateAction = { $push: {'likes': req.user.username} }

    

    models.Posts.findOneAndUpdate(query, performUpdateAction, {'new': true})
    .then(() => {
        res.json({success: true});
    })
    .catch((err) => {
        res.status(500).json({success: false});
        console.log(err);
    });

});

// User following another user
router.post('/:user/followers', (req, res) => {
    
    const query = {
        username: req.params.user
    };
    const myUserName = req.user.username;
    const userIWantToFollow = req.params.user;

    let myFollowingAction;
    let updateAction;


    // If I follow them already pull their name from their follower list and my following list
    if(req.body.iFollow){
        updateAction = {$pull: {followers: myUserName} };
        myFollowingAction = {$pull: {following: userIWantToFollow} };
    }
    else{
        updateAction = {$push: {followers: myUserName} };
        myFollowingAction = {$push: {following: userIWantToFollow} };
    }
            

    // Go to the user I want to follow and add my data to their follower array
    models.Users.findOneAndUpdate(query, updateAction)
    .then(() => {
        // Add user's data to my following array
        models.Users.findOneAndUpdate({username: req.user.username}, myFollowingAction)
        .then(() => {

            const prevFollowingData = req.body.iFollow;
            let nowFollowing;
           
            prevFollowingData ? nowFollowing = false : nowFollowing = true;
            res.json({actionSuccess: true, iFollow: nowFollowing});
        });
        
    })
    .catch((err) => {

        console.log(err);
    });


});

// Getting list of users of followers (MODAL DISPLAY)
router.get('/:user/ff/followers', (req, res) => {
    
    const query = {
        username: req.params.user
    };

    // Projection
    const filterFollowers = { followers: 1 };
    const filterFollowing = { following: 1 };
    
    // Find the user whose followers we'd like to view, project only their followers
    models.Users.findOne(query, filterFollowers)
    .then((user) => {
        
        // Place the usernames into our array (LIST OF USERNAMES)
        const followers = user.followers.map((username) => username);

        // Find those users and only project their username and avatar
        models.Users.find({username: {$in: followers}}, {username: 1, 'profile.avatar':1})
        .then((result) => {

            // Shadow variable (LIST OF USER DOCUMENTS)
            const followers = result.map( (user) => user.toObject());
            
            // Query for the users that I follow
            models.Users.findOne({username: req.user.username}, filterFollowing).then((data) => {

                const myFollowing = data.following;

                // See if I one of the requested user's followers already
                for(let i = 0; i < followers.length; i++){
                    for(let j = 0; j < myFollowing.length; j++){
                        if(followers[i].username === myFollowing[j]){
                            followers[i].iFollow = true;
                        }
                        else{
                            followers[i].iFollow = false;
                        }
                    }
                }
                res.json({ff: followers});
            })
            .catch((err) => {
                console.log(err);
            });
            
        });
        
    })
    .catch((err) => {
        console.log(err);
    });


});

// Getting list of users of following (MODAL DISPLAY)
router.get('/:user/ff/following', (req, res) => {
    

    const query = {
        username: req.params.user
    };
   // Projection
   const filterFollowing = { following: 1 };
   
   // Find the user whose followers we'd like to view, project only their followers
   models.Users.findOne(query, filterFollowing)
   .then((user) => {
       
       // Place the usernames into our array
       const following = user.following.map((username) => username);

       // Find those users and only project their username and avatar
       models.Users.find({username: {$in: following}}, {username: 1, 'profile.avatar':1})
       .then((result) => {

           const following = result.map( (user) => user.toObject());
       
           // Query for the users that I follow
           models.Users.findOne({username: req.user.username}, filterFollowing).then((data) => {

               let myFollowing = data.following;

               // See if I follow a user that the requested user follows
               for(let i = 0; i < following.length; i++){
   
                    // If I'm viewing my own page set all iFollow to true 
                    if(req.user.username == req.params.user){
                        following[i].iFollow = true;
                    }
                    else{
                        for(let j = 0; j < myFollowing.length; j++){
                            
                            if(following[i].username === myFollowing[j]){
                                following[i].iFollow = true;
                            }
                            else{
                                following[i].iFollow = false;
                            }
                        }
                    } 
                }   

               res.json({ff: following});
           })
           .catch((err) => {
               console.log(err);
           });
           
       });
       
   })
   .catch((err) => {
       console.log(err);
   });


});


module.exports = router;