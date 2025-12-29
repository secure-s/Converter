pipeline {
    agent any
    stages {
        stage('1. Checkout') {
            steps { 
                checkout scm 
            }
        }
        stage('2. Docker Build & Push') {
            steps {
                script {
                    def image = docker.build("shahabb/webapp:${env.BUILD_ID}")
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        stage('3. Start Minikube (Fixed Memory)') {
            steps {
                sh '''
                minikube delete --all --purge || true
                minikube start --driver=docker --memory=2048 --cpus=1 || true
                eval $(minikube docker-env)
                kubectl cluster-info || true
                '''
            }
        }
        stage('4. Deploy to Kubernetes') {
            steps {
                sh '''
                kubectl apply -f k8s-deployment.yaml
                kubectl rollout status deployment/webapp --timeout=300s || true
                kubectl port-forward service/webapp-service 8081:80 &
                echo "✅ App live at: http://13.60.66.81:8081"
                echo "✅ Jenkins: http://13.60.66.81:8080"
                '''
            }
        }
    }
    post {
        always {
            sh '''
            kubectl get pods || true
            kubectl get svc || true
            minikube status || true
            '''
        }
        success {
            echo '🎉 FULL PIPELINE SUCCESS: GitHub→Jenkins→Docker→Kubernetes!'
            echo '📱 Access your app: http://13.60.66.81:8081'
        }
        failure {
            echo '❌ Pipeline failed. Check Minikube logs above.'
        }
    }
}
