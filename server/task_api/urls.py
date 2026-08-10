from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def connection(request):
    return JsonResponse({"connected":True})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/test/', connection),
    path('api/v1/tasks/', include('task_app.urls')),
    path('api/v1/users/', include('user_app.urls')),
]