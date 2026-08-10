from django.urls import path
from .views import *

urlpatterns = [
    path("", AllTasks.as_view()),
    path("<int:task_id>/", ATask.as_view())
]