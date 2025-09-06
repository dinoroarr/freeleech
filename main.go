package main

import (
	"context"

	trackers "github.com/dinoroarr/tracker-info/gen/Trackers"
)


func main() {
	info, err := trackers.LoadFromPath(context.Background(), "pkl/local/trackers.pkl")

	if err != nil {
		panic(err)
	}

	print(info.Trackers.Name)
}
