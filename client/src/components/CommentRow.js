import React from 'react';
import { connect } from 'react-redux';

const CommentRow = (props) => {

    let authorizedUser;
    let viewingUserAuth;


    if(props.viewingUser === props.comment.username){
        viewingUserAuth = true;
    }

    // If the user is viewing their own profile avoid having two delete comment options
    if(props.urlParams.username === props.username && viewingUserAuth !== true){
        authorizedUser = true;
    }

    
    function deleteThis(evt){
        
        let keyID = evt.target.getAttribute('data-item-id');
        props.handleDeleteComment(keyID);
    }


    return(
        <div className="comment-row" style={{width: '100%'}}>
                <img className="user-avatar" src={props.comment.avatar}/>
            <div>
                <div className="user-data">
                    <span>{props.comment.username} </span>
                    <span style={{color: "gray", fontSize: ".5rem"}}>{props.comment.date_posted}</span>
                </div>
                <div className="user-comment">
                    <p>{props.comment.comment}</p>
                </div>
                { authorizedUser &&
                <div className="delete-comment" style={{color: "red"}} onClick={deleteThis} data-item-id={props.comment._id}>Delete Comment!</div>}
                { viewingUserAuth &&
                <div className="delete-comment" style={{color: "red"}} onClick={deleteThis} data-item-id={props.comment._id}>Delete Comment!</div>}
            </div>

        </div>
    )
}

function mapStateToProps(state){
    return {
        isAuth: state.isAuth,
        username: state.username
    }
}

export default connect(mapStateToProps)(CommentRow);