running=1
finish()
{
	running=0
}

trap finish SIGINT

while(( running )); do
	lt --port 3000 -s brew
	echo "restarting server"
	sleep 5
done
