// Code generated from Pkl module `main.trackerInfo.gen.TrackerInfo`. DO NOT EDIT.
package trackerinfo

import (
	"context"

	"github.com/apple/pkl-go/pkl"
	"github.com/dinoroarr/tracker-info/gen/TrackerInfo/tracker"
)

type TrackerInfo struct {
	Name string `pkl:"name"`

	Code tracker.Tracker `pkl:"code"`

	Domain string `pkl:"domain"`
}

// LoadFromPath loads the pkl module at the given path and evaluates it into a TrackerInfo
func LoadFromPath(ctx context.Context, path string) (ret TrackerInfo, err error) {
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

// Load loads the pkl module at the given source and evaluates it with the given evaluator into a TrackerInfo
func Load(ctx context.Context, evaluator pkl.Evaluator, source *pkl.ModuleSource) (TrackerInfo, error) {
	var ret TrackerInfo
	err := evaluator.EvaluateModule(ctx, source, &ret)
	return ret, err
}
