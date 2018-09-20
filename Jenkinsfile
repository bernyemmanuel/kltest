node {
   def commit_id
   stage('Preparation') {
     checkout scm
     sh "git rev-parse --short HEAD > .git/commit-id"                        
     commit_id = readFile('.git/commit-id').trim()
   }
   stage('docker build/push') {
     docker.withRegistry('https://index.docker.io/v1/', 'docker-berny') {
       def app = docker.build("bernyemmanuel/staging:TEST${commit_id}", '.').push()
     }
   }
}
