import React, { Component } from 'react';
import Item from './Item';
import { getData, sendUserData } from '../util/serverFetch';
import { Redirect, Link } from 'react-router-dom'; 
import ConfirmAction from './ConfirmAction';
import { connect } from 'react-redux';

class EditPost extends Component{
    constructor(props){
        super(props);

        this.state = {
            caption: '',
            items: [],
            image: '',
            actionSuccess: false,
            statusMessage: '',
            showConfirmation: false
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.captionChange = this.captionChange.bind(this);
        this.handleAddItemToState = this.handleAddItemToState.bind(this);
    }

    // Get Post data to fill in inputs
    componentDidMount(){

        const urlPostID = this.props.urlParams.match.params.postid;
        const urlUser = this.props.username;

        const serverResponse = getData(`/user/${urlUser}/${urlPostID}`);

        serverResponse.then(response => response.json())
        .then((data) => {

            this.setState({
                image: data.post.image,
                caption: data.post.caption,
            }, () => {
                // Set caption input to value stored in database
                const postCaption = document.querySelector('.post__caption');
                postCaption.value = this.state.caption;
            }); 
        })
        .catch((err) => {
            this.setState({
                showConfirmation: true,
                statusMessage: 'Could not load up post. Try again later'
            });
            console.log(err);
        });
    }

    // User input change for photo caption
    captionChange(evt){
        this.setState({caption: evt.target.value});
    }

    // Lifting state from Item.js
    handleAddItemToState(itemState){
        this.setState({ items: itemState});
    }

    // Updated post to server
    handleSubmit(evt){
        evt.preventDefault();

        const username = this.props.username;
        const urlPostID = this.props.urlParams.match.params.postid;
        
        const { items, caption } = this.state;
        const data = {
            items: items,
            caption: caption
        };

        const serverResponse = sendUserData(`/user/${username}/${urlPostID}/edit`, data);

        serverResponse
        .then( response => response.json())
        .then(() => {

            this.setState({
                showConfirmation: true,
                actionSuccess: true,
                statusMessage: 'Updated!'
            });
        })
        .catch((err) => {
            
            this.setState({
                showConfirmation: true,
                statusMessage: 'Could not update your post at the moment. Try again later.'
            });
            console.log(err);
        });
    }

    render(){

        const urlUser = this.props.urlParams.match.params.user;
        const {isAuth, username} = this.props;
        const urlPostID = this.props.urlParams.match.params.postid;
        
        // Make sure only authorized user can visit this page
        if(urlUser !== username && !isAuth){
            return <Redirect to={`/user/${urlUser}/${urlPostID}`} />
        }

        return(
            <section>
                <Link to={`/user/${urlUser}/${urlPostID}`}>Back to Post</Link>
                {this.state.showConfirmation &&
                <ConfirmAction statusMessage={this.state.statusMessage}/>}
                <img src={this.state.image} />
                <form onSubmit={this.handleSubmit}>
                    <textarea placeholder='Write a caption...' name="usercaption" className="post__caption" onChange={this.captionChange}>
                    </textarea>
                    <Item editPost={true} urlParams={this.props.urlParams} addItemToParentState={this.handleAddItemToState}/>
                    <button>Save</button>
                </form>
            </section>
        )
    }
}

function mapStateToProps(state){
    return {
        username: state.username,
        isAuth: state.isAuth
    }
}

export default connect(mapStateToProps)(EditPost);
