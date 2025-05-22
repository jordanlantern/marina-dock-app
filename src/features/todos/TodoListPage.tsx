// src/features/todos/TodoListPage.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { supabase } from '~/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Trash2 } from 'lucide-react'; 
import { cn } from '~/lib/utils';

// Define the structure of a To-Do item based on your Supabase table
interface TodoItem {
  id: number; 
  created_at: string;
  task: string;
  is_completed: boolean;
}

const TodoListPage: React.FC = () => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const [fetchTodosError, setFetchTodosError] = useState<string | null>(null);
  const [updatingTodoId, setUpdatingTodoId] = useState<number | null>(null);
  const [deletingTodoId, setDeletingTodoId] = useState<number | null>(null); 

  // Function to fetch todos
  const fetchTodos = async () => {
    setIsLoadingTodos(true);
    setFetchTodosError(null);
    console.log("Fetching to-dos from Supabase...");
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false }); 

    if (error) {
      console.error("Error fetching to-dos:", error);
      setFetchTodosError(`Failed to load tasks: ${error.message}`);
    } else if (data) {
      console.log("Fetched to-dos:", data);
      setTodos(data as TodoItem[]);
    }
    setIsLoadingTodos(false);
  };

  // Fetch todos when component mounts
  useEffect(() => {
    fetchTodos();
  }, []); 

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewTaskText(event.target.value);
  };

  const handleAddTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTaskText.trim()) {
      setAddError("Task cannot be empty.");
      return;
    }
    setIsAdding(true);
    setAddError(null);
    const newTodo = { task: newTaskText.trim(), is_completed: false };
    console.log("Attempting to add new to-do:", newTodo);
    const { error } = await supabase.from('todos').insert([newTodo]);
    setIsAdding(false);
    if (error) {
      console.error("Error adding to-do:", error);
      setAddError(`Failed to add task: ${error.message}`);
    } else {
      console.log("To-do added successfully!");
      setNewTaskText('');
      fetchTodos(); 
    }
  };

  const handleToggleComplete = async (id: number, currentStatus: boolean) => {
    if (updatingTodoId === id || deletingTodoId === id) return; 

    console.log(`Toggling complete for to-do ID: ${id}. New status will be: ${!currentStatus}`);
    setUpdatingTodoId(id); 

    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !currentStatus })
      .eq('id', id);

    setUpdatingTodoId(null); 

    if (error) {
      console.error("Error updating to-do status:", error);
      alert(`Failed to update task status: ${error.message}`); 
    } else {
      console.log("To-do status updated successfully in Supabase!");
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id ? { ...todo, is_completed: !currentStatus } : todo
        )
      );
    }
  };

  const handleDeleteTodo = async (id: number, taskText: string) => {
    if (deletingTodoId === id || updatingTodoId === id) return; // Prevent action if already processing

    const confirmed = window.confirm(`Are you sure you want to delete this task: "${taskText}"?`);
    if (!confirmed) {
      return;
    }

    console.log(`Attempting to delete to-do ID: ${id}`);
    setDeletingTodoId(id);

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    setDeletingTodoId(null);

    if (error) {
      console.error("Error deleting to-do:", error);
      alert(`Failed to delete task: ${error.message}`); 
    } else {
      console.log("To-do deleted successfully from Supabase!");
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-slate-700">Marina To-Do List</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter new task..."
              value={newTaskText}
              onChange={handleInputChange}
              className="flex-grow"
              disabled={isAdding}
            />
            <Button type="submit" disabled={isAdding || !newTaskText.trim()}>
              {isAdding ? 'Adding...' : 'Add Task'}
            </Button>
          </form>
          {addError && <p className="text-sm text-red-500 mt-2">{addError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Tasks</CardTitle>
          {isLoadingTodos && <CardDescription>Loading tasks...</CardDescription>}
          {fetchTodosError && <CardDescription className="text-red-500">{fetchTodosError}</CardDescription>}
        </CardHeader>
        <CardContent>
          { !isLoadingTodos && !fetchTodosError && todos.length === 0 && (
            <p className="text-gray-500">No tasks yet. Add one above!</p>
          )}
          {todos.length > 0 && (
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li 
                  key={todo.id} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-md border transition-colors duration-150",
                    todo.is_completed ? "bg-slate-100 text-slate-500 " : "bg-white hover:bg-slate-50",
                    (updatingTodoId === todo.id || deletingTodoId === todo.id) ? "opacity-50 cursor-wait" : "" 
                  )}
                >
                  <div className="flex items-center space-x-3 flex-grow min-w-0">
                    <Checkbox
                      id={`todo-${todo.id}`}
                      checked={todo.is_completed}
                      onCheckedChange={() => handleToggleComplete(todo.id, todo.is_completed)}
                      disabled={updatingTodoId === todo.id || deletingTodoId === todo.id}
                      aria-label={`Mark task "${todo.task}" as ${todo.is_completed ? 'not completed' : 'completed'}`}
                    />
                    <label 
                      htmlFor={`todo-${todo.id}`} 
                      className={cn(
                        "text-sm font-medium cursor-pointer break-all", 
                        todo.is_completed ? "line-through text-slate-500" : "text-slate-800"
                      )}
                      onClick={() => !(updatingTodoId === todo.id || deletingTodoId === todo.id) && handleToggleComplete(todo.id, todo.is_completed)}
                    >
                      {todo.task}
                    </label>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteTodo(todo.id, todo.task)}
                    disabled={updatingTodoId === todo.id || deletingTodoId === todo.id} // Enable the button, disable if other action pending
                    className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                    aria-label={`Delete task "${todo.task}"`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TodoListPage;