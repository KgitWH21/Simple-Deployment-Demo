import { useRouteError, Link } from "react-router-dom";


const ErrorPage =()=>{
    const error  = useRouteError();
    console.log(error);

    return (
        <>
            <h1>Something went wrong</h1>
            <p> {error?.message  ?? "Unknown Error"} </p>
            <Link to="/">Back to the Login Page</Link>
        </>
    );

};

export default ErrorPage;