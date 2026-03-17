import time
from unittest.mock import Mock

import pytest

from pipeline import AIFactoryPipeline, PipelineError


@pytest.fixture
def sample_data():
    return [
        {"features": [1, 2, 3], "target": 6},
        {"features": [2, 3, 4], "target": 9},
        {"features": [3, 4, 5], "target": 12},
    ]


def test_ingest_accepts_inline_data(sample_data):
    pipeline = AIFactoryPipeline()

    ingested = pipeline.ingest(sample_data)

    assert ingested == sample_data


def test_ingest_uses_configured_data_source(sample_data):
    data_source = Mock(return_value=sample_data)
    pipeline = AIFactoryPipeline(data_source=data_source)

    ingested = pipeline.ingest()

    assert ingested == sample_data
    data_source.assert_called_once_with()


def test_process_creates_numeric_features_and_feature_sum(sample_data):
    pipeline = AIFactoryPipeline()

    processed = pipeline.process(sample_data)

    assert processed[0]["features"] == [1.0, 2.0, 3.0]
    assert processed[0]["target"] == 6.0
    assert processed[0]["feature_sum"] == 6.0


def test_train_returns_baseline_model(sample_data):
    pipeline = AIFactoryPipeline()

    processed = pipeline.process(sample_data)
    model = pipeline.train(processed)

    assert model["algorithm"] == "mean-baseline"
    assert model["feature_count"] == 3
    assert model["prediction"] == pytest.approx(9.0)


def test_evaluate_returns_expected_metrics(sample_data):
    pipeline = AIFactoryPipeline()

    processed = pipeline.process(sample_data)
    model = {"prediction": 9.0}
    metrics = pipeline.evaluate(model, processed)

    assert metrics["sample_count"] == 3
    assert metrics["mae"] == pytest.approx(2.0)


def test_run_executes_full_pipeline(sample_data):
    pipeline = AIFactoryPipeline()

    result = pipeline.run(sample_data)

    assert result["record_count"] == 3
    assert result["model"]["prediction"] == pytest.approx(9.0)
    assert result["metrics"]["mae"] == pytest.approx(2.0)


def test_run_supports_mocked_trainer_and_evaluator(sample_data):
    trainer = Mock(return_value={"prediction": 42.0, "algorithm": "mocked"})
    evaluator = Mock(return_value={"mae": 0.0, "sample_count": 3})
    pipeline = AIFactoryPipeline(trainer=trainer, evaluator=evaluator)

    result = pipeline.run(sample_data)

    assert result["model"]["prediction"] == 42.0
    trainer.assert_called_once()
    evaluator.assert_called_once()


@pytest.mark.parametrize(
    "bad_data, message",
    [
        ([], "no input records"),
        ([{"target": 1}], "include 'features' and 'target'"),
        ([{"features": [], "target": 1}], "non-empty features list"),
        ([{"features": ["x"], "target": 1}], "non-numeric values"),
        (["not-a-record"], "must be a dictionary"),
    ],
)
def test_ingest_rejects_invalid_input(bad_data, message):
    pipeline = AIFactoryPipeline()

    with pytest.raises(PipelineError, match=message):
        pipeline.ingest(bad_data)


def test_ingest_requires_data_source_when_no_inline_data():
    pipeline = AIFactoryPipeline()

    with pytest.raises(PipelineError, match="No data provided and no data source configured"):
        pipeline.ingest()


def test_process_rejects_empty_records():
    pipeline = AIFactoryPipeline()

    with pytest.raises(PipelineError, match="No records available to process"):
        pipeline.process([])


def test_train_rejects_empty_processed_records():
    pipeline = AIFactoryPipeline()

    with pytest.raises(PipelineError, match="No processed records available for training"):
        pipeline.train([])


def test_evaluate_rejects_empty_processed_records():
    pipeline = AIFactoryPipeline()

    with pytest.raises(PipelineError, match="No processed records available for evaluation"):
        pipeline.evaluate({"prediction": 1.0}, [])


def test_pipeline_run_meets_small_dataset_performance_budget():
    pipeline = AIFactoryPipeline()
    dataset = [
        {"features": [index, index + 1, index + 2], "target": index * 2}
        for index in range(1000)
    ]

    start = time.perf_counter()
    result = pipeline.run(dataset)
    duration = time.perf_counter() - start

    assert result["record_count"] == 1000
    assert duration < 0.5
