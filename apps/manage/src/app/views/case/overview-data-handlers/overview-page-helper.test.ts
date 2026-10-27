import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileUploadQuestionProperties } from '../questions.ts';
import { journeyFileUploadQuestionConfigs } from '../controller.ts';

describe('OverviewPageHelper', () => {
	it('includes every FILE_UPLOADER question in a journey file upload config', () => {
		const journeyUploadUrls = new Set(
			Object.values(journeyFileUploadQuestionConfigs)
				.flat()
				.map((config) => config.url)
		);
		const missing = Object.entries(fileUploadQuestionProperties)
			.filter(
				([, question]) =>
					!journeyUploadUrls.has(question.url as string) &&
					!Object.values(journeyFileUploadQuestionConfigs)
						.flat()
						.some((config) => config.url.startsWith(question.url as string))
			)
			.map(([key, question]) => `${key} (${question.url})`);
		assert.deepEqual(missing, []);
	});
});
