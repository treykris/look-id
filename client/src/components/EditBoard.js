import React, { Component } from 'react';
import Stream from './Stream';
import PageHead from './PageHead';
import { getData, sendUserData } from '../util/serverFetch';
import { Redirect } from 'react-router-dom';
import ConfirmAction from './ConfirmAction';
import NotFound from './NotFound';


class EditBoard extends Component{
    constructor(props){
        super(props);

        this.state = {
            postsToDelete: [],
            streamData: [],
            boardName: '',
            actionSuccess: false,
            statusMessage: '',
            showConfirmation: false,
            notFound: false
        };

        this.handlePostDelete = this.handlePostDelete.bind(this);
        this.handleFilterPost = this.handleFilterPost.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleNameChange =  this.handleNameChange.bind(this);
    }


    // Get Board data
    componentDidMount(){

        const boardID = this.props.urlParams.match.params.boardid;
        const serverResponse = getData(`/board/${boardID}`);

        // Get Profile Data
        serverResponse.then(response => response.json())
        .then((data) => {

            if(data.error) return Promise.reject(new Error(data.error));

            this.setState({
                streamData: data.stream,
                boardName: data.boardName
            });
        })
        .catch((err) => {
            this.setState({
                notFound: true
            });
            console.log(err);
        });
    }

    // Filter out post
    handleFilterPost(postID){
        this.setState({
            postsToDelete: this.state.postsToDelete.filter((post) => {
                if(post.postID !== postID) return post;
            })
        });
    }

    // Delete post
    handlePostDelete(post, target){

        // User toggling class - Add to state if it's an item user would like to delete
        // Filter if otherwise
        if(target.classList.contains('post__image--edit')){
            this.setState({
                postsToDelete: this.state.postsToDelete.concat(post)
            });
        }
        else{
            this.handleFilterPost(post.postID);
        }
    }

    // Update Board submit - Delete posts or change board name
    handleSubmit(evt){
        evt.preventDefault();

        const data = {
            posts: this.state.postsToDelete,
            boardName: this.state.boardName
        };
        const postsToDeleteLength = this.state.postsToDelete.length;
        const boardID = this.props.urlParams.match.params.boardid;
        const serverResponse = sendUserData(`/board/${boardID}/edit`, data);

        serverResponse.then( response => response.json())
        .then((data) => {

            this.setState({
                showConfirmation: true,
                actionSuccess: true,
                statusMessage: `Deleted ${postsToDeleteLength} items`,
                postsToDelete: [],
                streamData: data.stream,
                boardName: data.boardName
            }, () => {
                const boardName = document.querySelector('.edit__name');
                boardName.value = this.state.boardName;
            });
        })
        .catch((err) => {

            this.setState({
                showConfirmation: true,
                statusMessage: 'Something went wrong with the server. Could not delete posts at the moment. Try again later.'
            });
            console.log(err);
        });
    }

    // onChange for changing board name
    handleNameChange(evt){
        this.setState({
            boardName: evt.target.value
        });
    }

    render(){
        
        const { notFound } = this.state; 
        let deleteMessage;

        if(notFound) return <NotFound />
        

        if(this.state.postsToDelete.length === 1){
            deleteMessage = `Delete (${this.state.postsToDelete.length}) item`;
        }
        else{
            deleteMessage = `Delete (${this.state.postsToDelete.length}) items`;
        }


        return(
            <section>
                <PageHead pageHead={`Edit ${this.state.boardName}`} />

                    {this.state.showConfirmation &&
                        <ConfirmAction statusMessage={this.state.statusMessage}/>}

                        <h1>Click on the images that you would like to delete</h1>
                <form onSubmit={this.handleSubmit}>
                    <label>Change board name:
                        <input type="text" name="board-name" className='edit__name' onChange={this.handleNameChange} value={this.state.boardName}/>
                    </label>
                    <span>{deleteMessage}</span>
                    <button>Update Board</button>
                </form>
                <Stream sourceFetch='stream' stream={this.state.streamData} edit={true} handlePostDelete={this.handlePostDelete}/>
                
            </section>
        )
    }

}


export default EditBoard;