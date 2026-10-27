import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileUploadQuestions, isRepeatableUploadFieldName } from './overview-page-helper.ts';
import { fileUploadQuestionProperties } from '../questions.ts';

describe('OverviewPageHelper', () => {
	it('includes every FILE_UPLOADER question in the previously uploaded documents check', () => {
		const missing = Object.entries(fileUploadQuestionProperties)
			.filter(
				([, question]) =>
					!fileUploadQuestions.includes(question.url as string) && !isRepeatableUploadFieldName(question.fieldName)
			)
			.map(([key, question]) => `${key} (${question.url})`);
		assert.deepEqual(missing, []);
	});
});
