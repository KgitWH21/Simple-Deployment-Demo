import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/esm/Button';
import { createTask } from '../utilites';

function TaskForm({addTask}) {
    const [taskTitle, setTaskTitle] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        const newTask = await createTask({title: taskTitle})
        if (newTask){
            addTask(newTask)
        }
        setTaskTitle('')
    }

    return (
        <>
            <Form onSubmit={handleSubmit} style={{width:"100%", display:"flex", justifyContent:"space-around"}}>
                <Form.Control
                    type="text"
                    placeholder='input a new task title here'
                    value={taskTitle}
                    onChange={(e)=>setTaskTitle(e.target.value)}
                />
                <Button type='submit'>
                    Create
                </Button>
            </Form>
        </>
    );
}

export default TaskForm;