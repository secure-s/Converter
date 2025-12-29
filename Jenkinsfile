pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Build Docker') {
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
    }
    post {
        success { echo '✅ Docker SUCCESS!' }
    }
}
