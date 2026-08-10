from user_app.views import UserView
from rest_framework.response import Response
from .serializers import TaskSerializer
from rest_framework import status as s

# Create your views here.
class AllTasks(UserView):
    def get(self, request):
        return Response(TaskSerializer(request.user.tasks.all(), many=True).data)

    def post(self, request):
        data = request.data.copy()
        data['user'] = request.user.id
        ser_task = TaskSerializer(data=data)
        if ser_task.is_valid():
            ser_task.save()
            return Response(ser_task.data, status=s.HTTP_201_CREATED)
        else:
            return Response(ser_task.errors, status=s.HTTP_400_BAD_REQUEST)

class ATask(UserView):
    def get(self, request, task_id):
        return Response(TaskSerializer(request.user.tasks.get(id=task_id)).data)

    def put(self, request, task_id):
        data = request.data.copy()
        ser_task = TaskSerializer(request.user.tasks.get(id=task_id), data=data, partial=True)
        if ser_task.is_valid():
            ser_task.save()
            return Response(ser_task.data)
        else:
            return Response(ser_task.errors, status=s.HTTP_400_BAD_REQUEST)

    def delete(self, request, task_id):
        task = request.user.tasks.get(id=task_id)
        return_string = f"{task.title} has been deleted"
        task.delete()
        return Response(return_string)