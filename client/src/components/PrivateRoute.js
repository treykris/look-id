import React from 'react';
import { Route, Redirect } from 'react-router';
import { connect } from 'react-redux';


function mapStateToProps(state) {
    return {
      isAuth: state.isAuth,
    };
}

const PrivateRoute = ({component: Component, ...rest}) => {
    
    return(
    <Route {...rest} render={(props) => (
        rest.isAuth ? 
            <Component {...props} /> 
            :
            <Redirect to='/login'/>
        )} />
    )
}




export default connect(mapStateToProps)(PrivateRoute)