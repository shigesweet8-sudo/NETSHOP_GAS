from __future__ import annotations

from dataclasses import dataclass
from statistics import mean
from typing import Callable, Iterable


class PipelineError(ValueError):
    """Raised when pipeline input or state is invalid."""


Record = dict[str, object]
ProcessedRecord = dict[str, object]
DataSource = Callable[[], Iterable[Record]]
Trainer = Callable[[list[ProcessedRecord]], dict[str, object]]
Evaluator = Callable[[dict[str, object], list[ProcessedRecord]], dict[str, object]]


@dataclass(frozen=True)
class BaselineModel:
    prediction: float
    feature_count: int


class AIFactoryPipeline:
    def __init__(
        self,
        data_source: DataSource | None = None,
        trainer: Trainer | None = None,
        evaluator: Evaluator | None = None,
    ) -> None:
        self._data_source = data_source
        self._trainer = trainer or self._default_trainer
        self._evaluator = evaluator or self._default_evaluator

    def ingest(self, data: Iterable[Record] | None = None) -> list[Record]:
        raw_records = list(data if data is not None else self._load_from_source())
        if not raw_records:
            raise PipelineError("Pipeline received no input records.")

        for index, record in enumerate(raw_records):
            self._validate_record(record, index)
        return raw_records

    def process(self, records: Iterable[Record]) -> list[ProcessedRecord]:
        processed_records: list[ProcessedRecord] = []
        for index, record in enumerate(records):
            self._validate_record(record, index)
            features = [float(value) for value in record["features"]]
            target = float(record["target"])
            processed_records.append(
                {
                    "features": features,
                    "target": target,
                    "feature_sum": sum(features),
                }
            )

        if not processed_records:
            raise PipelineError("No records available to process.")
        return processed_records

    def train(self, processed_records: Iterable[ProcessedRecord]) -> dict[str, object]:
        processed_list = list(processed_records)
        if not processed_list:
            raise PipelineError("No processed records available for training.")
        return self._trainer(processed_list)

    def evaluate(
        self,
        model: dict[str, object],
        processed_records: Iterable[ProcessedRecord],
    ) -> dict[str, object]:
        processed_list = list(processed_records)
        if not processed_list:
            raise PipelineError("No processed records available for evaluation.")
        return self._evaluator(model, processed_list)

    def run(self, data: Iterable[Record] | None = None) -> dict[str, object]:
        ingested = self.ingest(data)
        processed = self.process(ingested)
        model = self.train(processed)
        metrics = self.evaluate(model, processed)
        return {
            "record_count": len(ingested),
            "model": model,
            "metrics": metrics,
        }

    def _load_from_source(self) -> Iterable[Record]:
        if self._data_source is None:
            raise PipelineError("No data provided and no data source configured.")
        return self._data_source()

    @staticmethod
    def _validate_record(record: Record, index: int) -> None:
        if not isinstance(record, dict):
            raise PipelineError(f"Record {index} must be a dictionary.")
        if "features" not in record or "target" not in record:
            raise PipelineError(f"Record {index} must include 'features' and 'target'.")
        if not isinstance(record["features"], list) or not record["features"]:
            raise PipelineError(f"Record {index} must contain a non-empty features list.")
        try:
            [float(value) for value in record["features"]]
            float(record["target"])
        except (TypeError, ValueError) as exc:
            raise PipelineError(f"Record {index} contains non-numeric values.") from exc

    @staticmethod
    def _default_trainer(processed_records: list[ProcessedRecord]) -> dict[str, object]:
        targets = [float(record["target"]) for record in processed_records]
        feature_count = len(processed_records[0]["features"])
        model = BaselineModel(prediction=mean(targets), feature_count=feature_count)
        return {
            "prediction": model.prediction,
            "feature_count": model.feature_count,
            "algorithm": "mean-baseline",
        }

    @staticmethod
    def _default_evaluator(
        model: dict[str, object],
        processed_records: list[ProcessedRecord],
    ) -> dict[str, object]:
        prediction = float(model["prediction"])
        absolute_errors = [
            abs(float(record["target"]) - prediction) for record in processed_records
        ]
        return {
            "mae": mean(absolute_errors),
            "sample_count": len(processed_records),
        }
