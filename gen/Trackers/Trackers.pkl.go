// Code generated from Pkl module `main.trackerInfo.gen.Trackers`. DO NOT EDIT.
package trackers

import (
	"context"

	"github.com/apple/pkl-go/pkl"
	"github.com/dinoroarr/tracker-info/gen/TrackerInfo"
)

type Trackers struct {
	Trackers trackerinfo.TrackerInfo `pkl:"trackers"`
}

// LoadFromPath loads the pkl module at the given path and evaluates it into a Trackers
func LoadFromPath(ctx context.Context, path string) (ret Trackers, err error) {
	evaluator, err := pkl.NewEvaluator(ctx, pkl.PreconfiguredOptions)
	if err != nil {
		return ret, err
	}
	defer func() {
		cerr := evaluator.Close()
		if err == nil {
			err = cerr
		}
	}()
	ret, err = Load(ctx, evaluator, pkl.FileSource(path))
	return ret, err
}

// Load loads the pkl module at the given source and evaluates it with the given evaluator into a Trackers
func Load(ctx context.Context, evaluator pkl.Evaluator, source *pkl.ModuleSource) (Trackers, error) {
	var ret Trackers
	err := evaluator.EvaluateModule(ctx, source, &ret)
	return ret, err
}
