# Tests for ViaCRM

This directory contains tests for the ViaCRM project.

## Unit Tests

Unit tests are located in the `unit` directory and test individual components in isolation.

### Running Unit Tests

Run unit tests with PHPUnit:

```
vendor/bin/phpunit
```

### CI Integration

Tests automatically run in the GitLab CI pipeline in the "test" stage, which runs before other stages like "analyze" and "build".

If any tests fail, the pipeline will fail early and prevent potentially problematic code from progressing to later stages.